-- Fix signup failure due to duplicate inserts into user_roles during auth signup
-- Make the trigger function idempotent to avoid unique constraint violations

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Ensure default role without raising duplicate key errors
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente'::public.user_role)
  ON CONFLICT (user_id) DO NOTHING;

  -- Also ensure a customer profile exists (safe if another trigger already created it)
  INSERT INTO public.customer_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;
