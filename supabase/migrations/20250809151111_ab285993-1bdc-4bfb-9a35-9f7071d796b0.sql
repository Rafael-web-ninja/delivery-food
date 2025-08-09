-- Add minimum order value and business-level delivery time
ALTER TABLE public.delivery_businesses
  ADD COLUMN IF NOT EXISTS min_order_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_time_minutes integer NOT NULL DEFAULT 30;

-- Optional: set reasonable bounds (via trigger if needed later).