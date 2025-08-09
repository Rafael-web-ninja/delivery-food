-- Add slug column to delivery_businesses and unique index (case-insensitive)
ALTER TABLE public.delivery_businesses
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Ensure unique slugs regardless of case; allow multiple NULLs
CREATE UNIQUE INDEX IF NOT EXISTS delivery_businesses_slug_unique_idx
ON public.delivery_businesses (lower(slug));