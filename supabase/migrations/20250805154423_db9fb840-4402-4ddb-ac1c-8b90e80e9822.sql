-- Adicionar campos para personalização de cores de botões e tempo de entrega
ALTER TABLE public.delivery_businesses 
ADD COLUMN button_color text DEFAULT '#16A34A',
ADD COLUMN button_text_color text DEFAULT '#FFFFFF',
ADD COLUMN cart_button_color text DEFAULT '#16A34A',
ADD COLUMN cart_button_text_color text DEFAULT '#FFFFFF',
ADD COLUMN delivery_time_bg_color text DEFAULT '#000000',
ADD COLUMN delivery_time_text_color text DEFAULT '#FFFFFF';