-- Drop the problematic policy that already exists and recreate properly
DROP POLICY IF EXISTS "Public can view active businesses" ON public.delivery_businesses;

-- Fix the infinite recursion by removing self-referential policies
-- The issue is likely in a policy that does a subquery on the same table

-- Check if there are any policies that reference delivery_businesses within delivery_businesses policies
-- Let's simplify and recreate the essential policies only

CREATE POLICY "Public can view active businesses"
ON public.delivery_businesses
FOR SELECT
USING (is_active = true);