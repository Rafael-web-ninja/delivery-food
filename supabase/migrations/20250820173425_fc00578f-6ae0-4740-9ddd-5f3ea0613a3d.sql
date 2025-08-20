-- Ensure orders table has proper replica identity for realtime updates
-- This is needed for the realtime notifications to work correctly
ALTER TABLE public.orders REPLICA IDENTITY FULL;