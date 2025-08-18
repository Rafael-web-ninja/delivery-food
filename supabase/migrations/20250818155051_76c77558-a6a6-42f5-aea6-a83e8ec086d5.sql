-- Fix critical security vulnerability: Remove public access to subscriber tables
-- and ensure only authenticated users can view their own subscription data

-- Drop the overly permissive policy on subscribers table
DROP POLICY IF EXISTS "Service role full access" ON public.subscribers;

-- Ensure subscriber_plans has proper RLS policies (they look correct already)
-- The existing policies on subscriber_plans are:
-- - Users can view own subscription: (user_id = auth.uid()) OR (email = auth.email())
-- - Users can update own subscription: (user_id = auth.uid()) OR (email = auth.email())
-- - Insert subscription: true (needed for edge functions)

-- For subscribers table, we need to add a policy for edge functions to insert/update
-- (Edge functions use service role key which bypasses RLS, but let's be explicit)
CREATE POLICY "Edge functions can manage subscriptions" ON public.subscribers
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Verify that authenticated users can only see their own data
-- The existing SELECT policy is correct: (email = auth.email())
-- The existing UPDATE policy is correct: (email = auth.email())
-- The existing INSERT policy is correct: (email = auth.email())

-- Add a more restrictive policy for unauthenticated users (should see nothing)
CREATE POLICY "Deny anonymous access to subscriptions" ON public.subscribers
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY "Deny anonymous access to subscriber plans" ON public.subscriber_plans
  FOR SELECT
  TO anon
  USING (false);