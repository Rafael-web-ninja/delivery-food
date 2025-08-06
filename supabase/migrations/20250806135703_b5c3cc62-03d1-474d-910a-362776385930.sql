-- Corrigir políticas RLS para orders
DROP POLICY IF EXISTS "Customer can view their orders" ON orders;
DROP POLICY IF EXISTS "Delivery owners can view their orders" ON orders;

-- Política para clientes verem apenas seus próprios pedidos
CREATE POLICY "Customer can view their orders"
ON orders
FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM customer_profiles WHERE user_id = auth.uid()
  )
);

-- Política para donos de delivery verem apenas pedidos do seu delivery
CREATE POLICY "Delivery owners can view their orders"
ON orders
FOR SELECT
USING (
  business_id IN (
    SELECT id FROM delivery_businesses WHERE owner_id = auth.uid()
  )
);