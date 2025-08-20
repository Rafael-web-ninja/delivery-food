-- Fix infinite recursion in delivery_businesses RLS policies
-- Remove problematic policies first
DROP POLICY IF EXISTS "Anonymous users can view safe business info" ON public.delivery_businesses;
DROP POLICY IF EXISTS "Authenticated users can view active businesses" ON public.delivery_businesses;
DROP POLICY IF EXISTS "Authenticated users can view business info" ON public.delivery_businesses;

-- Create secure policies without circular references
CREATE POLICY "Public can view active businesses"
ON public.delivery_businesses
FOR SELECT
USING (is_active = true);

-- Business owners can manage their own business
CREATE POLICY "Business owners can manage their own business"
ON public.delivery_businesses
FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Fix the get_user_business_id function to be more robust
CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.delivery_businesses WHERE owner_id = auth.uid() LIMIT 1;
$$;

-- Ensure orders are properly isolated between businesses
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Business owners can update their orders" ON public.orders;
DROP POLICY IF EXISTS "Delivery owners can delete their orders" ON public.orders;
DROP POLICY IF EXISTS "Delivery owners can insert their orders" ON public.orders;
DROP POLICY IF EXISTS "Delivery owners can update their orders" ON public.orders;
DROP POLICY IF EXISTS "Delivery owners can view their orders" ON public.orders;

-- Create new secure policies for orders
CREATE POLICY "Business owners can view their business orders"
ON public.orders
FOR SELECT
USING (business_id = get_user_business_id());

CREATE POLICY "Business owners can update their business orders"
ON public.orders
FOR UPDATE
USING (business_id = get_user_business_id())
WITH CHECK (business_id = get_user_business_id());

CREATE POLICY "Business owners can insert orders for their business"
ON public.orders
FOR INSERT
WITH CHECK (business_id = get_user_business_id());

CREATE POLICY "Business owners can delete their business orders"
ON public.orders
FOR DELETE
USING (business_id = get_user_business_id());

-- Ensure order_items are also properly isolated
DROP POLICY IF EXISTS "Business owners can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Business owners can delete order items" ON public.order_items;
DROP POLICY IF EXISTS "Business owners can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Business owners can view their order items" ON public.order_items;

-- Create new secure policies for order_items
CREATE POLICY "Business owners can view their business order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_items.order_id 
    AND o.business_id = get_user_business_id()
  )
);

CREATE POLICY "Business owners can manage their business order items"
ON public.order_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_items.order_id 
    AND o.business_id = get_user_business_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_items.order_id 
    AND o.business_id = get_user_business_id()
  )
);