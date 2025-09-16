-- Add first login tracking to customer profiles
ALTER TABLE public.customer_profiles 
ADD COLUMN IF NOT EXISTS first_login_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS temp_password_sent BOOLEAN DEFAULT FALSE;