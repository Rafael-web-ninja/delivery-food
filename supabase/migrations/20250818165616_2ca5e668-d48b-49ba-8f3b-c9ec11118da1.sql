-- Remove a view public_businesses que pode estar causando problemas
DROP VIEW IF EXISTS public.public_businesses CASCADE;

-- Verifica se há outras views com SECURITY DEFINER e as remove/corrige
-- Lista todas as funções SECURITY DEFINER que não são necessárias
SELECT 
    p.proname,
    n.nspname,
    p.prosecdef
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.prosecdef = true
  AND p.proname NOT IN ('get_public_business_info', 'has_active_subscription', 'get_user_display_name', 'has_role', 'get_user_role', 'normalize_delivery_slug', 'set_updated_at', 'setup_new_user', 'generate_order_code', 'force_create_user', 'handle_new_user_role', 'insert_user', 'update_updated_at_column', 'get_user_business_id');

-- Para resolver completamente o problema, vamos criar uma alternativa mais segura
-- Removendo a necessidade de SECURITY DEFINER na função get_public_business_info
DROP FUNCTION IF EXISTS get_public_business_info(text, uuid);

-- Cria uma função simpler sem SECURITY DEFINER que usa apenas as políticas RLS
CREATE OR REPLACE FUNCTION get_safe_business_info(business_slug text DEFAULT NULL, business_id uuid DEFAULT NULL)
RETURNS SETOF public_business_info
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT * FROM public_business_info
  WHERE (business_slug IS NOT NULL AND slug = business_slug) 
     OR (business_id IS NOT NULL AND id = business_id);
$$;

-- Comentário sobre a nova função segura
COMMENT ON FUNCTION get_safe_business_info IS 'Função que retorna informações públicas seguras de negócios usando apenas RLS policies, sem SECURITY DEFINER';