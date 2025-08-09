-- Create mapping table for allowed flavors per menu item
CREATE TABLE IF NOT EXISTS public.menu_item_flavors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  flavor_id uuid NOT NULL REFERENCES public.flavor_options(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(menu_item_id, flavor_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_menu_item_flavors_menu_item_id ON public.menu_item_flavors(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_flavors_flavor_id ON public.menu_item_flavors(flavor_id);

-- Enable RLS
ALTER TABLE public.menu_item_flavors ENABLE ROW LEVEL SECURITY;

-- Recreate policies safely
DROP POLICY IF EXISTS "Business owners manage their menu item flavors" ON public.menu_item_flavors;
DROP POLICY IF EXISTS "Public can view allowed flavors for active menu items" ON public.menu_item_flavors;

CREATE POLICY "Business owners manage their menu item flavors"
ON public.menu_item_flavors
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.menu_items mi
    WHERE mi.id = menu_item_id AND mi.business_id = public.get_user_business_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.menu_items mi
    WHERE mi.id = menu_item_id AND mi.business_id = public.get_user_business_id()
  )
);

CREATE POLICY "Public can view allowed flavors for active menu items"
ON public.menu_item_flavors
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.menu_items mi
    JOIN public.flavor_options fo ON fo.id = public.menu_item_flavors.flavor_id
    WHERE mi.id = public.menu_item_flavors.menu_item_id
      AND mi.active = true
      AND fo.active = true
  )
);
