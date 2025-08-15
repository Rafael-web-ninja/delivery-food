-- Fix customer profiles with null names
UPDATE customer_profiles 
SET name = 'Usuário' 
WHERE name IS NULL OR name = '';

-- Create a safer get_user_display_name function to prevent null reference errors
CREATE OR REPLACE FUNCTION public.get_user_display_name(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT COALESCE(
    (SELECT name FROM public.customer_profiles WHERE user_id = user_uuid AND name IS NOT NULL AND name != ''),
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = user_uuid),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = user_uuid),
    (SELECT SPLIT_PART(email, '@', 1) FROM auth.users WHERE id = user_uuid),
    'Usuário'
  );
$function$;