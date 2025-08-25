-- Fix critical RLS policy vulnerabilities

-- 1. Fix user_roles table RLS policies to prevent privilege escalation
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON public.user_roles;

-- Create secure policies for user_roles
CREATE POLICY "Service role can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (auth.role() = 'service_role'::text);

CREATE POLICY "Users can view their own role only" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Fix subscriber_plans INSERT policy to prevent unauthorized subscriptions
DROP POLICY IF EXISTS "Insert subscription" ON public.subscriber_plans;

-- Create secure policy that only allows service role to insert subscriptions
CREATE POLICY "Service role can insert subscriptions" 
ON public.subscriber_plans 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role'::text);

-- 3. Update all functions to use proper search_path for security
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.subscriber_plans 
    WHERE user_id = user_uuid 
    AND subscription_status = 'active' 
    AND (subscription_end IS NULL OR subscription_end > now())
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_display_name(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT name FROM public.customer_profiles WHERE user_id = user_uuid AND name IS NOT NULL AND name != ''),
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = user_uuid),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = user_uuid),
    (SELECT SPLIT_PART(email, '@', 1) FROM auth.users WHERE id = user_uuid),
    'Usuário'
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = user_uuid), 
    'cliente'::user_role
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id FROM public.delivery_businesses WHERE owner_id = auth.uid() LIMIT 1;
$function$;