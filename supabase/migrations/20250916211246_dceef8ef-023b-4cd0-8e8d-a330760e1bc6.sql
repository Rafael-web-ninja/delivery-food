-- Fix all remaining functions with search path issues

-- Update all other functions to ensure proper search_path is set

-- Fix send_welcome_email_on_checkout function
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_checkout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  temp_password text;
BEGIN
  -- Only send welcome email if user was created via checkout (has subscription_created metadata)
  IF NEW.raw_user_meta_data->>'subscription_created' = 'true' THEN
    -- Generate random password for new users
    temp_password := substr(md5(random()::text), 1, 12);
    
    -- Use pg_net to call our edge function (if available) or log for manual processing
    -- This is a fallback since we can't guarantee pg_net is enabled
    INSERT INTO auth_notifications (
      user_id,
      email,
      notification_type,
      temporary_password,
      created_at
    ) VALUES (
      NEW.id,
      NEW.email,
      'welcome_email',
      temp_password,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix setup_new_user function  
CREATE OR REPLACE FUNCTION public.setup_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Cria um registro na tabela user_roles para cada novo usuário
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'cliente'::user_role)
  ON CONFLICT (user_id) DO NOTHING;

  -- Cria também o perfil do cliente
  INSERT INTO customer_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Fix generate_order_code function
CREATE OR REPLACE FUNCTION public.generate_order_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
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

-- Fix force_create_user function
CREATE OR REPLACE FUNCTION public.force_create_user(email text, password text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  new_id uuid := gen_random_uuid();
begin
  -- insere na tabela auth.users
  insert into auth.users (id, email, raw_user_meta_data)
  values (new_id, email, '{}'::jsonb);

  -- cria o perfil automaticamente
  insert into customer_profiles(user_id)
  values (new_id)
  on conflict (user_id) do nothing;

  -- garante o papel padrão
  insert into user_roles(user_id, role)
  values (new_id, 'cliente'::user_role)
  on conflict (user_id) do nothing;

  return new_id;
exception when others then
  raise exception 'Erro ao criar usuário: %', sqlerrm;
end;
$$;