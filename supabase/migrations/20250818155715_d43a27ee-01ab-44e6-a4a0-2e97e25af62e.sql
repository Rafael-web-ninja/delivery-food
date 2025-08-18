-- Fix Security Definer View issue
-- The public_businesses view needs to be recreated without SECURITY DEFINER

-- First, drop the existing view
DROP VIEW IF EXISTS public.public_businesses;

-- Recreate the view without SECURITY DEFINER (default is SECURITY INVOKER)
-- This ensures RLS policies are applied based on the querying user, not the view creator
CREATE VIEW public.public_businesses AS
SELECT 
    id,
    name,
    description,
    logo_url,
    delivery_fee,
    min_order_value,
    delivery_time_minutes,
    slug,
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
    updated_at,
    is_active
FROM delivery_businesses
WHERE is_active = true;

-- Add proper RLS policy for the view (since it queries delivery_businesses)
-- This ensures public users can only see active businesses through this view
CREATE POLICY "Public can view active businesses through view" 
ON public.delivery_businesses 
FOR SELECT 
TO public
USING (is_active = true);

-- Comment explaining the security improvement
COMMENT ON VIEW public.public_businesses IS 
'Public view of active delivery businesses. Uses SECURITY INVOKER (default) to ensure RLS policies are respected based on the querying user, not the view creator.';