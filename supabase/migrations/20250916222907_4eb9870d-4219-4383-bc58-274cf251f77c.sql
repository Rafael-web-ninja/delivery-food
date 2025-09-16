-- First drop all existing policies that depend on the user_id column
DROP POLICY IF EXISTS "Users can view their own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON customer_profiles;
DROP POLICY IF EXISTS "select_own_profile" ON customer_profiles;
DROP POLICY IF EXISTS "update_own_profile" ON customer_profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON customer_profiles;

-- Now we can safely alter the column type
ALTER TABLE customer_profiles 
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='customer_profiles' AND constraint_name='customer_profiles_user_id_key'
  ) THEN
    ALTER TABLE customer_profiles
      ADD CONSTRAINT customer_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policies
CREATE POLICY "select_own_profile" ON customer_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "update_own_profile" ON customer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "insert_own_profile" ON customer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RPC function for maximum reliability
CREATE OR REPLACE FUNCTION public.upsert_customer_profile(
  p_user_id uuid,
  p_name text,
  p_phone text,
  p_zip_code text,
  p_street text,
  p_street_number text,
  p_neighborhood text,
  p_city text,
  p_state text,
  p_complement text
)
RETURNS customer_profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE 
  v_row customer_profiles;
BEGIN
  -- Security check: only allow users to upsert their own profile
  IF p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  -- Perform upsert
  INSERT INTO customer_profiles (
    user_id, name, phone, zip_code, street, street_number, 
    neighborhood, city, state, complement, updated_at
  ) VALUES (
    p_user_id, p_name, p_phone, p_zip_code, p_street, p_street_number, 
    p_neighborhood, p_city, p_state, p_complement, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    zip_code = EXCLUDED.zip_code,
    street = EXCLUDED.street,
    street_number = EXCLUDED.street_number,
    neighborhood = EXCLUDED.neighborhood,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    complement = EXCLUDED.complement,
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.upsert_customer_profile(
  uuid, text, text, text, text, text, text, text, text, text
) TO anon, authenticated;