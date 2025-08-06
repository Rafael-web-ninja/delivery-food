-- Migrar pedidos antigos que têm customer_id null para customer_id correto
-- baseado no user_id e customer_profiles existentes

UPDATE orders 
SET customer_id = (
  SELECT cp.id 
  FROM customer_profiles cp 
  WHERE cp.user_id = orders.user_id
)
WHERE customer_id IS NULL 
AND user_id IS NOT NULL
AND EXISTS (
  SELECT 1 
  FROM customer_profiles cp 
  WHERE cp.user_id = orders.user_id
);