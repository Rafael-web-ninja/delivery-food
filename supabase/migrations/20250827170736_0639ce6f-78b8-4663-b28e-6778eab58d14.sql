-- Adicionar campo CNPJ na tabela delivery_businesses
ALTER TABLE public.delivery_businesses 
ADD COLUMN cnpj TEXT;