-- Atualizar a tabela orders para ter relacionamento correto
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id);

-- Verificar se delivery_id existe, se não, usar business_id
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_id UUID REFERENCES delivery_businesses(id);

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_id ON orders(delivery_id);
CREATE INDEX IF NOT EXISTS idx_orders_business_id ON orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Atualizar RLS policies para orders (sem duplicar políticas existentes)
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Business owners can view their business orders" ON orders;

-- Nova policy para clientes verem seus próprios pedidos
CREATE POLICY "Customers can view their own orders" ON orders
FOR SELECT TO authenticated
USING (customer_id = auth.uid() OR user_id = auth.uid());

-- Nova policy para donos de delivery verem pedidos do seu negócio
CREATE POLICY "Business owners can view their business orders" ON orders
FOR SELECT TO authenticated
USING (business_id = get_user_business_id());

-- Policy para atualização de pedidos (apenas donos)
CREATE POLICY "Business owners can update their orders" ON orders
FOR UPDATE TO authenticated
USING (business_id = get_user_business_id());

-- Habilitar realtime para orders (apenas se necessário)
ALTER TABLE orders REPLICA IDENTITY FULL;