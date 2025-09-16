-- Enable real-time updates for orders table to support notifications
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Add the orders table to the realtime publication
-- This enables real-time subscriptions for INSERT, UPDATE, DELETE operations
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;