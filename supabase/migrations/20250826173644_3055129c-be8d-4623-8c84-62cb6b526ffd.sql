-- Ensure orders table is configured for realtime updates
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Add orders table to realtime publication if not already there
DO $$
BEGIN
  -- Try to add the table to the publication, ignore if already exists
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, that's fine
    NULL;
  END;
END $$;