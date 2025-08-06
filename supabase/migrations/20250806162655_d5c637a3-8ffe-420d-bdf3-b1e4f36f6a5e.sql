-- Corrigir pedidos antigos com delivery_id = NULL
-- Assumindo que business_id = delivery_id (mesmo negócio)
UPDATE orders
SET delivery_id = business_id, 
    user_id = (
      SELECT user_id 
      FROM customer_profiles 
      WHERE id = orders.customer_id
    )
WHERE delivery_id IS NULL OR user_id IS NULL;