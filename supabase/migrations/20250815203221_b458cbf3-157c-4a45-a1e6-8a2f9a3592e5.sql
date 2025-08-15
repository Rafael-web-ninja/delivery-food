-- Add column to allow orders when delivery is closed
ALTER TABLE public.delivery_businesses 
ADD COLUMN accept_orders_when_closed BOOLEAN NOT NULL DEFAULT false;