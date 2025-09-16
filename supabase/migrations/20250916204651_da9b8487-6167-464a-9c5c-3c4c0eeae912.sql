-- Add new address fields to customer_profiles table
ALTER TABLE public.customer_profiles 
ADD COLUMN zip_code text,
ADD COLUMN street text,
ADD COLUMN street_number text,
ADD COLUMN neighborhood text,
ADD COLUMN city text,
ADD COLUMN state text,
ADD COLUMN complement text;

-- Keep the old address field for backward compatibility
-- It will be gradually migrated/deprecated