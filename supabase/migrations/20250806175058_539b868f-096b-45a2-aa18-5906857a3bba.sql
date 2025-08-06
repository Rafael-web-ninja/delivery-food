-- Add order_code field to orders table for consistent order identification
ALTER TABLE public.orders 
ADD COLUMN order_code text;

-- Create a function to generate unique order codes
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    new_code text;
    code_exists boolean;
BEGIN
    LOOP
        -- Generate 8-character code from UUID
        new_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM orders WHERE order_code = new_code) INTO code_exists;
        
        -- Exit loop if code is unique
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$;

-- Update existing orders with generated order codes
UPDATE public.orders 
SET order_code = generate_order_code()
WHERE order_code IS NULL;