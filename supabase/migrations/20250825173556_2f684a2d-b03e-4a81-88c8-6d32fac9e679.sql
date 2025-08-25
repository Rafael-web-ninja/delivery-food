-- Update has_active_subscription function to consider 'trialing' status as active
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
    AND subscription_status IN ('active', 'trialing') 
    AND (subscription_end IS NULL OR subscription_end > now())
  );
$function$