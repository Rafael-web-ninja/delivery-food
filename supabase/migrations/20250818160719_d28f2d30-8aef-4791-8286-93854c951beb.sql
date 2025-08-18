-- Find any views with SECURITY DEFINER across all schemas
-- including those that might be created by Supabase internally

DO $$
DECLARE
    view_record RECORD;
    view_def TEXT;
BEGIN
    -- Check all views in all schemas
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
    LOOP
        view_def := pg_get_viewdef(view_record.viewname);
        
        -- Check if definition contains SECURITY DEFINER
        IF view_def ILIKE '%SECURITY DEFINER%' THEN
            RAISE NOTICE 'Found SECURITY DEFINER view: %.%', view_record.schemaname, view_record.viewname;
        END IF;
    END LOOP;
    
    -- Additional check for any functions that might be SECURITY DEFINER and used in views
    RAISE NOTICE 'Checking for SECURITY DEFINER functions...';
    
    FOR view_record IN 
        SELECT n.nspname as schema_name, p.proname as function_name, p.prosecdef
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.prosecdef = true
        AND n.nspname = 'public'
    LOOP
        RAISE NOTICE 'Found SECURITY DEFINER function: %.%', view_record.schema_name, view_record.function_name;
    END LOOP;
END $$;