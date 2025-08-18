-- Corrige a query anterior que teve erro de compatibilidade
DO $$ 
DECLARE
    view_rec RECORD;
BEGIN
    -- Verifica se há funções SECURITY DEFINER (sem usar proisagg que não existe na versão atual)
    FOR view_rec IN 
        SELECT n.nspname as schema_name, p.proname as func_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.prokind = 'f'
          AND p.prosecdef = true
    LOOP
        RAISE NOTICE 'Função SECURITY DEFINER encontrada: %.%', view_rec.schema_name, view_rec.func_name;
    END LOOP;
END $$;

-- Garante que a view está criada corretamente
CREATE OR REPLACE VIEW public.public_business_info AS
SELECT 
  id,
  name,
  description,
  logo_url,
  slug,
  is_active,
  delivery_time_minutes,
  min_order_value,
  delivery_fee,
  accept_orders_when_closed,
  primary_color,
  secondary_color,
  accent_color,
  background_color,
  text_color,
  button_color,
  button_text_color,
  cart_button_color,
  cart_button_text_color,
  delivery_time_bg_color,
  delivery_time_text_color,
  created_at,
  updated_at
FROM delivery_businesses
WHERE is_active = true;

-- Concede permissões explícitas à view
GRANT SELECT ON public.public_business_info TO anon;
GRANT SELECT ON public.public_business_info TO authenticated;