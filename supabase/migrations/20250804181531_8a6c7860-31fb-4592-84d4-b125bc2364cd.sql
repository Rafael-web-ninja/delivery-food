-- Adicionar políticas para permitir que usuários não logados criem pedidos
DROP POLICY IF EXISTS "Business owners can manage their orders" ON public.orders;

-- Criar política que permite inserção de pedidos públicos
CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- Proprietários podem ver e gerenciar pedidos do seu negócio
CREATE POLICY "Business owners can view their business orders" 
ON public.orders 
FOR SELECT 
USING (business_id = get_user_business_id());

CREATE POLICY "Business owners can update their business orders" 
ON public.orders 
FOR UPDATE 
USING (business_id = get_user_business_id());

CREATE POLICY "Business owners can delete their business orders" 
ON public.orders 
FOR DELETE 
USING (business_id = get_user_business_id());

-- Usuários podem ver seus próprios pedidos
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

-- Adicionar política similar para order_items
DROP POLICY IF EXISTS "Business owners can insert order items" ON public.order_items;

CREATE POLICY "Anyone can create order items" 
ON public.order_items 
FOR INSERT 
WITH CHECK (true);