-- Criar tabela para controle de assinaturas
CREATE TABLE IF NOT EXISTS public.subscriber_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'inactive',
  plan_type TEXT NOT NULL DEFAULT 'free',
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.subscriber_plans ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own subscription" 
ON public.subscriber_plans 
FOR SELECT 
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Users can update own subscription" 
ON public.subscriber_plans 
FOR UPDATE 
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Insert subscription" 
ON public.subscriber_plans 
FOR INSERT 
WITH CHECK (true);

-- Função para verificar se usuário tem assinatura ativa
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.subscriber_plans 
    WHERE user_id = user_uuid 
    AND subscription_status = 'active' 
    AND (subscription_end IS NULL OR subscription_end > now())
  );
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_subscriber_plans_updated_at
BEFORE UPDATE ON public.subscriber_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();