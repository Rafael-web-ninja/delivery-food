-- Create missing policies for order_items (INSERT, UPDATE, DELETE)
CREATE POLICY "Business owners can insert order items" ON public.order_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_items.order_id 
    AND o.business_id = public.get_user_business_id()
  )
);

CREATE POLICY "Business owners can update order items" ON public.order_items
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_items.order_id 
    AND o.business_id = public.get_user_business_id()
  )
);

CREATE POLICY "Business owners can delete order items" ON public.order_items
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_items.order_id 
    AND o.business_id = public.get_user_business_id()
  )
);

-- Also fix the table that was mentioned in bd-delibery - it seems to have RLS enabled but no policies
-- First check if it exists and create a simple policy
CREATE POLICY "Allow read access" ON "bd-delibery"
FOR SELECT USING (true);

CREATE POLICY "Allow insert access" ON "bd-delibery"
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access" ON "bd-delibery"
FOR UPDATE USING (true);

CREATE POLICY "Allow delete access" ON "bd-delibery"
FOR DELETE USING (true);