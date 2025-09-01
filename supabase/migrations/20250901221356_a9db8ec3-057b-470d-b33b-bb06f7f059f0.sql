-- Remover a constraint antiga
ALTER TABLE payment_methods DROP CONSTRAINT payment_methods_type_check;

-- Criar nova constraint com mais opções de pagamento
ALTER TABLE payment_methods ADD CONSTRAINT payment_methods_type_check 
CHECK (type = ANY (ARRAY['cash', 'pix', 'credit_card', 'debit_card', 'card', 'vr', 'food_voucher']::text[]));