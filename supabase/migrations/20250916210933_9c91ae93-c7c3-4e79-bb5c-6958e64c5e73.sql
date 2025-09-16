-- Fix security issues in subscriber_plans table

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Deny anonymous access to subscriber plans" ON subscriber_plans;
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriber_plans;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriber_plans;
DROP POLICY IF EXISTS "Service role can insert subscriptions" ON subscriber_plans;

-- Make user_id not nullable to prevent security gaps
-- First update any null user_ids by finding the corresponding user from email
UPDATE subscriber_plans 
SET user_id = (
  SELECT id FROM auth.users 
  WHERE auth.users.email = subscriber_plans.email
)
WHERE user_id IS NULL;

-- Now make user_id not nullable
ALTER TABLE subscriber_plans ALTER COLUMN user_id SET NOT NULL;

-- Create secure policies with unique names

-- Policy 1: Only subscription owners can view their data
CREATE POLICY "subscription_owners_read_only" 
ON subscriber_plans 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Only subscription owners can update their data  
CREATE POLICY "subscription_owners_update_only" 
ON subscriber_plans 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 3: Only service role can insert (for Stripe webhooks)
CREATE POLICY "service_role_insert_only" 
ON subscriber_plans 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Policy 4: Service role full access for admin operations
CREATE POLICY "service_role_admin_access" 
ON subscriber_plans 
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 5: Block all anonymous access
CREATE POLICY "block_anonymous_completely" 
ON subscriber_plans 
FOR ALL
TO anon
USING (false)
WITH CHECK (false);