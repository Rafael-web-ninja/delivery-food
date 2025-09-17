-- Fix infinite recursion in delivery_businesses RLS policies
-- Problem: The current policies likely reference the delivery_businesses table directly

-- First, let's create a security definer function to safely check business ownership
CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM delivery_businesses WHERE owner_id = auth.uid() LIMIT 1;
$$;

-- Now recreate the problematic policies using the function instead of direct table reference
-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Business owners can view their complete business info" ON public.delivery_businesses;
DROP POLICY IF EXISTS "Public can view limited business info" ON public.delivery_businesses;
DROP POLICY IF EXISTS "Users can insert their own business" ON public.delivery_businesses;
DROP POLICY IF EXISTS "Users can update their own business" ON public.delivery_businesses;
DROP POLICY IF EXISTS "Business owners can manage their own business" ON public.delivery_businesses;

-- Recreate policies without table self-reference
CREATE POLICY "Business owners can manage their own business"
ON public.delivery_businesses
FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Public can view active businesses"
ON public.delivery_businesses
FOR SELECT
USING (is_active = true);

-- Fix any other functions that might have similar issues
CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM delivery_businesses WHERE owner_id = auth.uid() LIMIT 1;
$$;