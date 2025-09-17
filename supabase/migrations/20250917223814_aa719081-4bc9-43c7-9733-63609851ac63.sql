-- Update the upsert_customer_profile function to also populate the address field
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
SET search_path TO 'public'
AS $function$
DECLARE 
  v_row customer_profiles;
  v_address text;
BEGIN
  -- Security check: only allow users to upsert their own profile
  IF p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  -- Build the concatenated address string
  v_address := '';
  
  IF p_street IS NOT NULL AND p_street != '' THEN
    v_address := p_street;
  END IF;
  
  IF p_street_number IS NOT NULL AND p_street_number != '' THEN
    IF v_address != '' THEN
      v_address := v_address || ', ' || p_street_number;
    ELSE
      v_address := p_street_number;
    END IF;
  END IF;
  
  IF p_neighborhood IS NOT NULL AND p_neighborhood != '' THEN
    IF v_address != '' THEN
      v_address := v_address || ' - ' || p_neighborhood;
    ELSE
      v_address := p_neighborhood;
    END IF;
  END IF;
  
  IF p_city IS NOT NULL AND p_city != '' THEN
    IF v_address != '' THEN
      v_address := v_address || ', ' || p_city;
    ELSE
      v_address := p_city;
    END IF;
  END IF;
  
  IF p_state IS NOT NULL AND p_state != '' THEN
    IF v_address != '' THEN
      v_address := v_address || ' - ' || p_state;
    ELSE
      v_address := p_state;
    END IF;
  END IF;
  
  IF p_zip_code IS NOT NULL AND p_zip_code != '' THEN
    IF v_address != '' THEN
      v_address := v_address || ', ' || p_zip_code;
    ELSE
      v_address := p_zip_code;
    END IF;
  END IF;
  
  IF p_complement IS NOT NULL AND p_complement != '' THEN
    IF v_address != '' THEN
      v_address := v_address || ' (' || p_complement || ')';
    ELSE
      v_address := p_complement;
    END IF;
  END IF;

  -- Perform upsert using INSERT ... ON CONFLICT, now including the concatenated address
  INSERT INTO customer_profiles (
    user_id, name, phone, zip_code, street, street_number, 
    neighborhood, city, state, complement, address, updated_at
  ) VALUES (
    p_user_id, p_name, p_phone, p_zip_code, p_street, p_street_number, 
    p_neighborhood, p_city, p_state, p_complement, v_address, now()
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
    address = EXCLUDED.address,
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$;