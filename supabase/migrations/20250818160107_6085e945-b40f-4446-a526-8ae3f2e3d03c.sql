-- Check if there are any remaining security definer views in the system
-- This query will help us identify any problematic views

SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE definition ILIKE '%SECURITY DEFINER%'
   OR definition ILIKE '%security_definer%';