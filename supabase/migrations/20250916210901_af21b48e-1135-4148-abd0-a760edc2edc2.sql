-- Fix security issues in subscriber_plans table

-- First, drop the existing problematic policies
DROP POLICY IF EXISTS "Deny anonymous access to subscriber plans" ON subscriber_plans;
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriber_plans;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriber_plans;

-- Make user_id not nullable to prevent security gaps (if there are existing records with null user_id, we'll handle them)
-- First update any null user_ids by finding the corresponding user from email
UPDATE subscriber_plans 
SET user_id = (
  SELECT id FROM auth.users 
  WHERE auth.users.email = subscriber_plans.email
)
WHERE user_id IS NULL;

-- Now make user_id not nullable
ALTER TABLE subscriber_plans ALTER COLUMN user_id SET NOT NULL;

-- Create more secure policies

-- Policy 1: Only authenticated users can access subscription data
CREATE POLICY "Authenticated users only" 
ON subscriber_plans 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Users can only update their own subscriptions
CREATE POLICY "Users can update own subscription only" 
ON subscriber_plans 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 3: Service role can manage all subscriptions (for Stripe webhooks and admin operations)
CREATE POLICY "Service role full access" 
ON subscriber_plans 
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 4: Only service role can insert new subscriptions (typically from Stripe webhooks)
CREATE POLICY "Service role can insert subscriptions" 
ON subscriber_plans 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Policy 5: Prevent anonymous access completely
CREATE POLICY "Block anonymous access" 
ON subscriber_plans 
FOR ALL
TO anon
USING (false)
WITH CHECK (false);