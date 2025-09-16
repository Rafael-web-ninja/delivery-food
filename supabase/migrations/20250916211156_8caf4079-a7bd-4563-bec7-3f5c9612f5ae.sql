-- Fix remaining functions that may still have search path issues

-- Fix all remaining functions to ensure they have proper search_path

-- Update the normalize_delivery_slug function
CREATE OR REPLACE FUNCTION public.normalize_delivery_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    RETURN NEW;
  END IF;
  -- Trim, lowercase, replace spaces with dashes, remove invalid chars, collapse multiple dashes
  NEW.slug := lower(trim(NEW.slug));
  NEW.slug := regexp_replace(NEW.slug, '\s+', '-', 'g');
  NEW.slug := regexp_replace(NEW.slug, '[^a-z0-9\-]', '', 'g');
  NEW.slug := regexp_replace(NEW.slug, '-{2,}', '-', 'g');
  RETURN NEW;
END;
$$;

-- Update the set_updated_at function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;