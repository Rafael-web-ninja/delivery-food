-- Complete fix for orders and history with RLS
-- Update old orders to link them to customer_profiles
UPDATE orders 
SET customer_id = (
  SELECT cp.id 
  FROM customer_profiles cp 
  WHERE cp.user_id = orders.user_id
  LIMIT 1
)
WHERE customer_id IS NULL 
  AND user_id IS NOT NULL;

-- Try to link by matching customer email with user email (if email field exists)
UPDATE orders 
SET customer_id = (
  SELECT cp.id 
  FROM customer_profiles cp 
  INNER JOIN auth.users au ON au.id = cp.user_id
  WHERE au.email = orders.customer_name -- Assuming customer_name might contain email
  LIMIT 1
)
WHERE customer_id IS NULL 
  AND customer_name LIKE '%@%';

-- Ensure order_items has proper RLS policies too
DROP POLICY IF EXISTS "Anyone can create order items" ON order_items;
DROP POLICY IF EXISTS "Business owners can view their order items" ON order_items;
DROP POLICY IF EXISTS "Business owners can update order items" ON order_items;
DROP POLICY IF EXISTS "Business owners can delete order items" ON order_items;

-- Order items policies - customers can create, business owners can manage
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