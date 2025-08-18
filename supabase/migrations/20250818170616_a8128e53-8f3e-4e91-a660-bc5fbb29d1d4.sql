-- Abordagem mais simples e direta para resolver o problema
-- Recria a view de forma segura
DROP VIEW IF EXISTS public.public_business_info CASCADE;

CREATE VIEW public.public_business_info AS
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

-- Concede permissões necessárias
GRANT SELECT ON public.public_business_info TO anon;
GRANT SELECT ON public.public_business_info TO authenticated;

-- Atualiza comentário
COMMENT ON VIEW public_business_info IS 'View pública segura que expõe apenas informações não-sensíveis dos negócios';