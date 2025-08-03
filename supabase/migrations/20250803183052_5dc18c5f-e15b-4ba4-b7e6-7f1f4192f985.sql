-- Fix function search path mutable issue
CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS UUID 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.delivery_businesses WHERE owner_id = auth.uid();
$$;

-- Fix RLS enabled no policy - add missing policies for delivery_businesses
CREATE POLICY "Users can insert their own business" ON public.delivery_businesses
FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Add update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Create trigger for delivery_businesses updated_at
CREATE TRIGGER update_delivery_businesses_updated_at
BEFORE UPDATE ON public.delivery_businesses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create triggers for other tables updated_at
CREATE TRIGGER update_menu_categories_updated_at
BEFORE UPDATE ON public.menu_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();