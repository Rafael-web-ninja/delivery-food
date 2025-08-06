-- Fix order creation and history system (corrected)
-- First, drop existing policies on orders
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Customer can view their own orders" ON orders;
DROP POLICY IF EXISTS "Delivery owners can view their delivery orders" ON orders;
DROP POLICY IF EXISTS "Business owners can view their business orders" ON orders;
DROP POLICY IF EXISTS "Business owners can update their business orders" ON orders;
DROP POLICY IF EXISTS "Business owners can delete their business orders" ON orders;

-- Create comprehensive RLS policies for orders
-- 1. Customers can view their own orders
CREATE POLICY "Customer can view their orders"
ON orders
FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM customer_profiles WHERE user_id = auth.uid()
  )
);

-- 2. Delivery owners can view orders for their delivery business
CREATE POLICY "Delivery owners can view their orders"
ON orders
FOR SELECT
USING (
  business_id IN (
    SELECT id FROM delivery_businesses WHERE owner_id = auth.uid()
  )
);

-- 3. Customers can create orders (authenticated users only)
CREATE POLICY "Customer can create orders"
ON orders
FOR INSERT
WITH CHECK (
  customer_id IN (
    SELECT id FROM customer_profiles WHERE user_id = auth.uid()
  )
);

-- 4. Delivery owners can update orders for their business
CREATE POLICY "Delivery owners can update their orders"
ON orders
FOR UPDATE
USING (
  business_id IN (
    SELECT id FROM delivery_businesses WHERE owner_id = auth.uid()
  )
);

-- 5. Delivery owners can delete orders for their business
CREATE POLICY "Delivery owners can delete their orders"
ON orders
FOR DELETE
USING (
  business_id IN (
    SELECT id FROM delivery_businesses WHERE owner_id = auth.uid()
  )
);