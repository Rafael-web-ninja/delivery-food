-- Fix the SECURITY DEFINER issue with the public business view
-- Recreate the view with SECURITY INVOKER to ensure proper RLS enforcement

DROP VIEW IF EXISTS public.public_business_info;

-- Create view with SECURITY INVOKER to enforce RLS properly
CREATE VIEW public.public_business_info 
WITH (security_invoker = true) AS
SELECT 
  id,
  name,
  description,
  phone,
  address,
  logo_url,
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
  delivery_time_minutes,
  delivery_fee,
  min_order_value,
  accept_orders_when_closed,
  allow_scheduling,
  allow_pickup,
  slug,
  is_active,
  created_at,
  updated_at
FROM public.delivery_businesses
WHERE is_active = true;

-- Grant access to the view
GRANT SELECT ON public.public_business_info TO anon;
GRANT SELECT ON public.public_business_info TO authenticated;

-- Update the comment
COMMENT ON VIEW public.public_business_info IS 'SECURITY INVOKER view of delivery businesses that excludes sensitive information like owner_id and cnpj';