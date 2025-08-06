-- Fix order_items RLS policies only (skip updating old orders with invalid references)

-- Ensure order_items has proper RLS policies
DROP POLICY IF EXISTS "Anyone can create order items" ON order_items;
DROP POLICY IF EXISTS "Business owners can view their order items" ON order_items;
DROP POLICY IF EXISTS "Business owners can update order items" ON order_items;
DROP POLICY IF EXISTS "Business owners can delete order items" ON order_items;
DROP POLICY IF EXISTS "Customers can create order items" ON order_items;
DROP POLICY IF EXISTS "Customers can view their order items" ON order_items;

-- Order items policies - customers can create and view their items, business owners can manage
CREATE POLICY "Customers can create order items"
ON order_items
FOR INSERT
WITH CHECK (
  order_id IN (
    SELECT o.id FROM orders o
    WHERE o.customer_id IN (
      SELECT id FROM customer_profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Customers can view their order items"
ON order_items
FOR SELECT
USING (
  order_id IN (
    SELECT o.id FROM orders o
    WHERE o.customer_id IN (
      SELECT id FROM customer_profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Business owners can view their order items"
ON order_items
FOR SELECT
USING (
  order_id IN (
    SELECT o.id FROM orders o
    WHERE o.business_id IN (
      SELECT id FROM delivery_businesses WHERE owner_id = auth.uid()
    )
  )
);

CREATE POLICY "Business owners can update order items"
ON order_items
FOR UPDATE
USING (
  order_id IN (
    SELECT o.id FROM orders o
    WHERE o.business_id IN (
      SELECT id FROM delivery_businesses WHERE owner_id = auth.uid()
    )
  )
);

CREATE POLICY "Business owners can delete order items"
ON order_items
FOR DELETE
USING (
  order_id IN (
    SELECT o.id FROM orders o
    WHERE o.business_id IN (
      SELECT id FROM delivery_businesses WHERE owner_id = auth.uid()
    )
  )
);