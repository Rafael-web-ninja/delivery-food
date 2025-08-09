-- 1) Enum for sizes
DO $$ BEGIN
  CREATE TYPE public.pizza_size AS ENUM ('broto', 'grande');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Flavor options table
CREATE TABLE IF NOT EXISTS public.flavor_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Flavor prices per size
CREATE TABLE IF NOT EXISTS public.flavor_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flavor_id uuid NOT NULL REFERENCES public.flavor_options(id) ON DELETE CASCADE,
  size public.pizza_size NOT NULL,
  price numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT flavor_size_unique UNIQUE (flavor_id, size)
);

-- 4) Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS set_flavor_options_updated_at ON public.flavor_options;
CREATE TRIGGER set_flavor_options_updated_at
BEFORE UPDATE ON public.flavor_options
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_flavor_prices_updated_at ON public.flavor_prices;
CREATE TRIGGER set_flavor_prices_updated_at
BEFORE UPDATE ON public.flavor_prices
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 5) Add supports_fractional to menu_items
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS supports_fractional boolean NOT NULL DEFAULT false;

-- 6) Enable RLS and policies
ALTER TABLE public.flavor_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flavor_prices ENABLE ROW LEVEL SECURITY;

-- Public can view active flavors (for public menus)
DROP POLICY IF EXISTS "Public can view active flavors" ON public.flavor_options;
CREATE POLICY "Public can view active flavors"
ON public.flavor_options
FOR SELECT
USING (active = true);

-- Business owners can manage their flavors
DROP POLICY IF EXISTS "Business owners manage flavors" ON public.flavor_options;
CREATE POLICY "Business owners manage flavors"
ON public.flavor_options
FOR ALL
USING (business_id = public.get_user_business_id())
WITH CHECK (business_id = public.get_user_business_id());

-- Public can view flavor prices when the parent flavor is active
DROP POLICY IF EXISTS "Public can view flavor prices for active flavors" ON public.flavor_prices;
CREATE POLICY "Public can view flavor prices for active flavors"
ON public.flavor_prices
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.flavor_options fo
    WHERE fo.id = flavor_prices.flavor_id AND fo.active = true
  )
);

-- Business owners can manage prices of their flavors
DROP POLICY IF EXISTS "Business owners manage flavor prices" ON public.flavor_prices;
CREATE POLICY "Business owners manage flavor prices"
ON public.flavor_prices
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.flavor_options fo
    WHERE fo.id = flavor_prices.flavor_id AND fo.business_id = public.get_user_business_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.flavor_options fo
    WHERE fo.id = flavor_prices.flavor_id AND fo.business_id = public.get_user_business_id()
  )
);
