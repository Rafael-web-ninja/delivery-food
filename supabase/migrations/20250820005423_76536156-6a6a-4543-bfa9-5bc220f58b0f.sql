-- Remove the potentially problematic view and replace with proper RLS access
DROP VIEW IF EXISTS public.public_business_info;

-- The view was simply filtering active businesses, but since we have proper RLS policies
-- on delivery_businesses table, we don't need this view anymore.
-- Applications should query delivery_businesses directly with the is_active = true condition.

-- Verify our RLS policies on delivery_businesses are sufficient
-- (They were already fixed in the previous migration)

-- If any code was using public_business_info, it should now use delivery_businesses
-- with WHERE is_active = true condition instead.