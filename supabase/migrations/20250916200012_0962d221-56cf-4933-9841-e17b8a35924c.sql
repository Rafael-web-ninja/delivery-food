-- Enable real-time updates for orders table to support notifications
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Add the orders table to the realtime publication
-- This enables real-time subscriptions for INSERT, UPDATE, DELETE operations
BEGIN;
  -- Remove the table if it exists in the publication (to avoid errors)
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.orders;
  -- Add the table to enable real-time updates
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
COMMIT;