
-- 1) Enum para tipo de cupom
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coupon_type') THEN
    CREATE TYPE public.coupon_type AS ENUM ('percent', 'fixed');
  END IF;
END$$;

-- 2) Tabela de cupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  code text NOT NULL,
  type public.coupon_type NOT NULL,
  value numeric NOT NULL, -- valor ou percentual (ex: 10 = 10% quando type=percent)
  min_order_value numeric NOT NULL DEFAULT 0,
  start_at timestamptz NULL,
  end_at timestamptz NULL,
  max_uses integer NULL,
  uses_count integer NOT NULL DEFAULT 0,
  max_uses_per_customer integer NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coupons_business_code_unique UNIQUE (business_id, code)
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_coupons_business ON public.coupons (business_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (code);
CREATE INDEX IF NOT EXISTS idx_coupons_active_window ON public.coupons (is_active, start_at, end_at);

-- Trigger para updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_coupons_updated_at'
  ) THEN
    CREATE TRIGGER trg_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- 3) RLS para coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Dono do negócio pode gerenciar seus cupons
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'coupons' AND policyname = 'Business owners manage coupons'
  ) THEN
    CREATE POLICY "Business owners manage coupons"
      ON public.coupons
      FOR ALL
      USING (business_id = public.get_user_business_id())
      WITH CHECK (business_id = public.get_user_business_id());
  END IF;
END$$;

-- Público pode ver cupons ativos e válidos (para validação no checkout)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'coupons' AND policyname = 'Public can view active and valid coupons'
  ) THEN
    CREATE POLICY "Public can view active and valid coupons"
      ON public.coupons
      FOR SELECT
      USING (
        is_active = true
        AND (start_at IS NULL OR start_at <= now())
        AND (end_at IS NULL OR end_at >= now())
      );
  END IF;
END$$;

-- 4) Tabela de usos/redemptions de cupons
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id uuid NULL REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
  discount_amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coupon_redemptions_one_per_order UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON public.coupon_redemptions (coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_order ON public.coupon_redemptions (order_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_customer ON public.coupon_redemptions (customer_id);

-- 5) RLS para coupon_redemptions
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Dono do negócio pode gerenciar redemptions de pedidos do seu negócio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'coupon_redemptions' AND policyname = 'Business owners manage redemptions'
  ) THEN
    CREATE POLICY "Business owners manage redemptions"
      ON public.coupon_redemptions
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = coupon_redemptions.order_id
          AND o.business_id = public.get_user_business_id()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = coupon_redemptions.order_id
          AND o.business_id = public.get_user_business_id()
        )
      );
  END IF;
END$$;

-- Clientes podem criar redemptions para seus próprios pedidos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'coupon_redemptions' AND policyname = 'Customers can insert own redemptions'
  ) THEN
    CREATE POLICY "Customers can insert own redemptions"
      ON public.coupon_redemptions
      FOR INSERT
      WITH CHECK (
        order_id IN (
          SELECT o.id FROM public.orders o
          WHERE o.customer_id IN (
            SELECT cp.id FROM public.customer_profiles cp
            WHERE cp.user_id = auth.uid()
          )
        )
      );
  END IF;
END$$;

-- Clientes podem ver redemptions dos próprios pedidos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'coupon_redemptions' AND policyname = 'Customers can view own redemptions'
  ) THEN
    CREATE POLICY "Customers can view own redemptions"
      ON public.coupon_redemptions
      FOR SELECT
      USING (
        order_id IN (
          SELECT o.id FROM public.orders o
          WHERE o.customer_id IN (
            SELECT cp.id FROM public.customer_profiles cp
            WHERE cp.user_id = auth.uid()
          )
        )
      );
  END IF;
END$$;

-- 6) Trigger para validar e incrementar uso de cupom no momento da inserção do redemption
CREATE OR REPLACE FUNCTION public.validate_and_increment_coupon_usage()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  c RECORD;
  order_business uuid;
  customer_uses integer;
BEGIN
  -- Bloqueia e carrega o cupom
  SELECT * INTO c FROM public.coupons WHERE id = NEW.coupon_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cupom não encontrado';
  END IF;

  -- Verifica se o pedido pertence ao mesmo negócio do cupom
  SELECT o.business_id INTO order_business
  FROM public.orders o
  WHERE o.id = NEW.order_id;

  IF order_business IS NULL OR order_business <> c.business_id THEN
    RAISE EXCEPTION 'Cupom não pertence a este estabelecimento';
  END IF;

  -- Valida status/validade
  IF c.is_active IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Cupom inativo';
  END IF;

  IF c.start_at IS NOT NULL AND c.start_at > now() THEN
    RAISE EXCEPTION 'Cupom ainda não está válido';
  END IF;

  IF c.end_at IS NOT NULL AND c.end_at < now() THEN
    RAISE EXCEPTION 'Cupom expirado';
  END IF;

  -- Limite total de usos
  IF c.max_uses IS NOT NULL AND c.uses_count >= c.max_uses THEN
    RAISE EXCEPTION 'Limite total de uso do cupom atingido';
  END IF;

  -- Limite por cliente
  IF c.max_uses_per_customer IS NOT NULL THEN
    IF NEW.customer_id IS NULL THEN
      RAISE EXCEPTION 'customer_id é obrigatório para usar este cupom';
    END IF;
    SELECT COUNT(*) INTO customer_uses
    FROM public.coupon_redemptions cr
    WHERE cr.coupon_id = c.id
      AND cr.customer_id = NEW.customer_id;

    IF customer_uses >= c.max_uses_per_customer THEN
      RAISE EXCEPTION 'Limite de uso por cliente atingido';
    END IF;
  END IF;

  -- Incrementa o contador de uso
  UPDATE public.coupons
  SET uses_count = uses_count + 1,
      updated_at = now()
  WHERE id = c.id;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_coupon_redemptions_validate ON public.coupon_redemptions;

CREATE TRIGGER trg_coupon_redemptions_validate
BEFORE INSERT ON public.coupon_redemptions
FOR EACH ROW
EXECUTE FUNCTION public.validate_and_increment_coupon_usage();

-- 7) Ajustes na tabela orders: desconto, cupom e agendamento
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN discount_amount numeric NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'coupon_code'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN coupon_code text NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN scheduled_at timestamptz NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_orders_scheduled_at ON public.orders (scheduled_at);

-- 8) Flag para habilitar agendamento no negócio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'delivery_businesses' AND column_name = 'allow_scheduling'
  ) THEN
    ALTER TABLE public.delivery_businesses
      ADD COLUMN allow_scheduling boolean NOT NULL DEFAULT false;
  END IF;
END$$;
