-- Fix security warning: set search_path for the function
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
SET search_path = public
AS $$
DECLARE 
  v_row customer_profiles;
BEGIN
  -- Security check: only allow users to upsert their own profile
  IF p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  -- Perform upsert using INSERT ... ON CONFLICT
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