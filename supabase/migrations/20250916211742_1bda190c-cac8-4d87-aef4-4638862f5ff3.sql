-- Fix remaining critical security vulnerabilities

-- 1. CRITICAL: Fix auth_notifications table - contains sensitive user data
-- Drop existing policies and create secure ones
DROP POLICY IF EXISTS "Service role can manage auth notifications" ON auth_notifications;

-- Only service role should access this table (for internal operations only)
CREATE POLICY "service_role_only_access" 
ON auth_notifications 
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Block all other access completely
CREATE POLICY "block_all_other_access" 
ON auth_notifications 
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- 2. CRITICAL: Ensure subscriber_plans is truly secure
-- Test if the current policies are working by recreating them with explicit blocking

-- Drop and recreate subscriber_plans policies to ensure they're working
DROP POLICY IF EXISTS "subscription_owners_read_only" ON subscriber_plans;
DROP POLICY IF EXISTS "subscription_owners_update_only" ON subscriber_plans;
DROP POLICY IF EXISTS "service_role_insert_only" ON subscriber_plans;
DROP POLICY IF EXISTS "service_role_admin_access" ON subscriber_plans;
DROP POLICY IF EXISTS "block_anonymous_completely" ON subscriber_plans;

-- Create more explicit and secure policies
CREATE POLICY "only_owner_can_read" 
ON subscriber_plans 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "only_owner_can_update" 
ON subscriber_plans 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Service role access for Stripe webhooks and admin
CREATE POLICY "service_role_complete_access" 
ON subscriber_plans 
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Explicitly block all anonymous access
CREATE POLICY "no_anonymous_access_ever" 
ON subscriber_plans 
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Block any public role access  
CREATE POLICY "no_public_access_ever" 
ON subscriber_plans 
FOR ALL
TO public
USING (false)
WITH CHECK (false);