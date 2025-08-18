-- Procura e remove qualquer view SECURITY DEFINER restante
-- Primeiro, vamos listar todas as views do sistema que podem estar causando o problema
DO $$ 
DECLARE
    view_rec RECORD;
BEGIN
    -- Loop através de todas as views do schema public
    FOR view_rec IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        -- Verifica se a definição da view contém SECURITY DEFINER
        IF EXISTS (
            SELECT 1 FROM pg_views 
            WHERE schemaname = view_rec.schemaname 
              AND viewname = view_rec.viewname 
              AND (definition ILIKE '%security%definer%' OR definition ILIKE '%security_definer%')
        ) THEN
            -- Se encontrar, remove a view
            EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_rec.schemaname, view_rec.viewname);
            RAISE NOTICE 'Removida view SECURITY DEFINER: %.%', view_rec.schemaname, view_rec.viewname;
        END IF;
    END LOOP;
    
    -- Verifica se há funções problemáticas que podem estar sendo detectadas como views
    FOR view_rec IN 
        SELECT n.nspname as schema_name, p.proname as func_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.proisagg = false
          AND p.prokind = 'f'
          AND p.prosecdef = true
    LOOP
        RAISE NOTICE 'Função SECURITY DEFINER encontrada: %.%', view_rec.schema_name, view_rec.func_name;
    END LOOP;
END $$;

-- Recria a view public_business_info de forma completamente segura
CREATE OR REPLACE VIEW public.public_business_info AS
SELECT 
  id,
  name,
  description,
  logo_url,
  slug,
  is_active,
  delivery_time_minutes,
  min_order_value,
  delivery_fee,
  accept_orders_when_closed,
  primary_color,
  secondary_color,
  accent_color,
  background_color,
  text_color,
  button_color,
  button_text_color,
  cart_button_color,
  cart_button_text_color,
  delivery_time_bg_color,
  delivery_time_text_color,
  created_at,
  updated_at
FROM delivery_businesses
WHERE is_active = true;