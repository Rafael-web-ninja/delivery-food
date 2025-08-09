-- Allow delivery owners to insert orders
CREATE POLICY "Delivery owners can insert their orders"
ON public.orders
FOR INSERT
WITH CHECK (business_id = get_user_business_id());

-- Allow business owners to insert order items for their orders
CREATE POLICY "Business owners can create order items"
ON public.order_items
FOR INSERT
WITH CHECK (
  order_id IN (
    SELECT o.id FROM public.orders o
    WHERE o.business_id IN (
      SELECT id FROM public.delivery_businesses WHERE owner_id = auth.uid()
    )
  )
);
