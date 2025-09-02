-- Adicionar coluna para permitir retirada de pedidos
ALTER TABLE public.delivery_businesses 
ADD COLUMN allow_pickup boolean NOT NULL DEFAULT false;