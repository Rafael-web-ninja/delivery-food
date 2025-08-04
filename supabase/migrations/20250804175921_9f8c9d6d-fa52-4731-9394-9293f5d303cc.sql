-- Adicionar campos para frete e personalização de cores
ALTER TABLE public.delivery_businesses 
ADD COLUMN delivery_fee NUMERIC DEFAULT 0,
ADD COLUMN primary_color TEXT DEFAULT '#2563eb',
ADD COLUMN secondary_color TEXT DEFAULT '#64748b',
ADD COLUMN accent_color TEXT DEFAULT '#059669',
ADD COLUMN background_color TEXT DEFAULT '#ffffff',
ADD COLUMN text_color TEXT DEFAULT '#1e293b';