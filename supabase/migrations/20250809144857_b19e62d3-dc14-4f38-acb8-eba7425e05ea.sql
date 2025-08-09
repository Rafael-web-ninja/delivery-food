-- Expand allowed values for payment_methods.type and keep legacy 'card'
ALTER TABLE public.payment_methods
  DROP CONSTRAINT IF EXISTS payment_methods_type_check;

ALTER TABLE public.payment_methods
  ADD CONSTRAINT payment_methods_type_check
  CHECK (type IN ('cash','pix','credit_card','debit_card','card'));
