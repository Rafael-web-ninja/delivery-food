-- Corrigir foreign key constraint e RLS policies

-- 1. Primeiro, remover a foreign key constraint incorreta se existir
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;

-- 2. Adicionar foreign key constraint correta para customer_profiles
ALTER TABLE orders 
ADD CONSTRAINT orders_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES customer_profiles(id) ON DELETE CASCADE;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Customer can view their orders" ON orders;
DROP POLICY IF EXISTS "Customer can create orders" ON orders;
DROP POLICY IF EXISTS "Delivery owners can view their orders" ON orders;
DROP POLICY IF EXISTS "Delivery owners can update their orders" ON orders;
DROP POLICY IF EXISTS "Delivery owners can delete their orders" ON orders;

-- 4. Clientes podem ver apenas seus pedidos
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

-- 5. Clientes podem criar pedidos
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

-- 6. Donos de delivery podem ver pedidos do seu delivery
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

-- 7. Donos de delivery podem atualizar pedidos do seu delivery
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

-- 8. Donos de delivery podem deletar pedidos do seu delivery
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