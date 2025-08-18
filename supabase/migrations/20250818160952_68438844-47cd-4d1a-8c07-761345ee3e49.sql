-- Simple check for SECURITY DEFINER functions in public schema
SELECT 
    n.nspname as schema_name, 
    p.proname as function_name,
    CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_type
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.prosecdef = true
ORDER BY p.proname;