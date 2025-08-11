-- Ensure slug support and normalization for delivery_businesses
BEGIN;

-- 1) Add slug column if not exists
ALTER TABLE public.delivery_businesses
  ADD COLUMN IF NOT EXISTS slug text;

-- 2) Create case-insensitive unique index on slug (when not null)
CREATE UNIQUE INDEX IF NOT EXISTS delivery_businesses_slug_unique
  ON public.delivery_businesses (lower(slug))
  WHERE slug IS NOT NULL;

-- 3) Ensure normalization trigger exists to sanitize slug on insert/update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'tr_normalize_delivery_slug'
  ) THEN
    CREATE TRIGGER tr_normalize_delivery_slug
    BEFORE INSERT OR UPDATE OF slug ON public.delivery_businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.normalize_delivery_slug();
  END IF;
END$$;

COMMIT;