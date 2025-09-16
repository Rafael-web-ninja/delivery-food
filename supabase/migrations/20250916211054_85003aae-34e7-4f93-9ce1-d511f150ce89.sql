-- Fix function search path security issues
-- Update all functions to have proper search_path set

-- Fix get_user_business_id function
CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM delivery_businesses WHERE owner_id = auth.uid() LIMIT 1;
$$;

-- Fix has_role function  
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Fix get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM user_roles WHERE user_id = user_uuid), 
    'cliente'::user_role
  );
$$;

-- Fix get_user_display_name function
CREATE OR REPLACE FUNCTION public.get_user_display_name(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT name FROM customer_profiles WHERE user_id = user_uuid AND name IS NOT NULL AND name != ''),
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = user_uuid),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = user_uuid),
    (SELECT SPLIT_PART(email, '@', 1) FROM auth.users WHERE id = user_uuid),
    'Usuário'
  );
$$;

-- Fix has_active_subscription function
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM subscriber_plans 
    WHERE user_id = user_uuid 
    AND subscription_status IN ('active', 'trialing') 
    AND (subscription_end IS NULL OR subscription_end > now())
  );
$$;