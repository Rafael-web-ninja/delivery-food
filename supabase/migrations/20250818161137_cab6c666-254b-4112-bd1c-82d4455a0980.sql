-- Review and fix SECURITY DEFINER functions that don't need elevated privileges
-- Keep SECURITY DEFINER only for functions that truly need it

-- Functions that should remain SECURITY DEFINER (need elevated privileges):
-- - setup_new_user (needs to create user profiles)
-- - handle_new_user_role (needs to assign roles)
-- - has_role (needs to check roles across RLS)
-- - get_user_role (needs to access user_roles table)
-- - get_user_display_name (needs to access profiles and auth)
-- - has_active_subscription (needs to check subscriptions)
-- - get_user_business_id (needs to access business data)
-- - force_create_user (admin function)
-- - insert_user (admin function)

-- Functions that can be changed to SECURITY INVOKER (don't need elevated privileges):
-- - normalize_delivery_slug (simple text processing)
-- - set_updated_at (simple timestamp update)
-- - update_updated_at_column (simple timestamp update)
-- - generate_order_code (simple UUID generation)

-- Change simple utility functions to SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.normalize_delivery_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.slug IS NULL THEN
    RETURN NEW;
  END IF;
  -- Trim, lowercase, replace spaces with dashes, remove invalid chars, collapse multiple dashes
  NEW.slug := lower(trim(NEW.slug));
  NEW.slug := regexp_replace(NEW.slug, '\s+', '-', 'g');
  NEW.slug := regexp_replace(NEW.slug, '[^a-z0-9\-]', '', 'g');
  NEW.slug := regexp_replace(NEW.slug, '-{2,}', '-', 'g');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_order_code()
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;