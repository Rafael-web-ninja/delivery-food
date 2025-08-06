-- Corrigir RLS policies para funcionar corretamente com customer_profiles

-- 1. Drop existing policies if they exist
DROP POLICY IF EXISTS "Customer can view their orders" ON orders;
DROP POLICY IF EXISTS "Customer can create orders" ON orders;
DROP POLICY IF EXISTS "Delivery owners can view their orders" ON orders;
DROP POLICY IF EXISTS "Delivery owners can update their orders" ON orders;
DROP POLICY IF EXISTS "Delivery owners can delete their orders" ON orders;

-- 2. Clientes podem ver apenas seus pedidos
CREATE POLICY "Customer can view their orders"
ON orders
FOR SELECT
USING (
  customer_id IN (
    SELECT id 
    FROM customer_profiles 
    WHERE user_id = auth.uid()
  )
);

-- 3. Clientes podem criar pedidos
CREATE POLICY "Customer can create orders"
ON orders
FOR INSERT
WITH CHECK (
  customer_id IN (
    SELECT id 
    FROM customer_profiles 
    WHERE user_id = auth.uid()
  )
);

-- 4. Donos de delivery podem ver pedidos do seu delivery
CREATE POLICY "Delivery owners can view their orders"
ON orders
FOR SELECT
USING (
  business_id IN (
    SELECT id 
    FROM delivery_businesses 
    WHERE owner_id = auth.uid()
  )
);

-- 5. Donos de delivery podem atualizar pedidos do seu delivery
CREATE POLICY "Delivery owners can update their orders"
ON orders
FOR UPDATE
USING (
  business_id IN (
    SELECT id 
    FROM delivery_businesses 
    WHERE owner_id = auth.uid()
  )
);

-- 6. Donos de delivery podem deletar pedidos do seu delivery
CREATE POLICY "Delivery owners can delete their orders"
ON orders
FOR DELETE
USING (
  business_id IN (
    SELECT id 
    FROM delivery_businesses 
    WHERE owner_id = auth.uid()
  )
);

-- 7. Atualizar pedidos antigos sem customer_id (se houver com user_id)
UPDATE orders o
SET customer_id = (
  SELECT cp.id 
  FROM customer_profiles cp
  WHERE cp.user_id = o.user_id
)
WHERE customer_id IS NULL AND user_id IS NOT NULL;