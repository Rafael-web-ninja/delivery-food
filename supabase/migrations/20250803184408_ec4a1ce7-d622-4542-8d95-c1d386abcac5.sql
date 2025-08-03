-- Allow public access to view delivery businesses (for public menu)
CREATE POLICY "Anyone can view active businesses" ON public.delivery_businesses
FOR SELECT USING (is_active = true);

-- Also need to allow public access to view menu categories
CREATE POLICY "Anyone can view active categories for public menu" ON public.menu_categories
FOR SELECT USING (active = true);

-- And allow public access to view menu items with business info
CREATE POLICY "Anyone can view active menu items with business" ON public.menu_items
FOR SELECT USING (
  active = true AND 
  EXISTS (
    SELECT 1 FROM public.delivery_businesses 
    WHERE id = menu_items.business_id 
    AND is_active = true
  )
);