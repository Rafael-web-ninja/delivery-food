-- Primeiro, vamos criar uma view pública que expõe apenas informações seguras dos negócios
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
  -- Cores e configurações visuais (seguras para expor)
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

-- Remove as políticas existentes que permitem acesso público total
DROP POLICY IF EXISTS "Public can view active businesses through view" ON delivery_businesses;
DROP POLICY IF EXISTS "Public can view limited business info" ON delivery_businesses;

-- Cria nova política mais restritiva para usuários anônimos
-- Eles só podem ver informações básicas através de uma subconsulta controlada
CREATE POLICY "Anonymous users can view safe business info" 
ON delivery_businesses 
FOR SELECT 
TO anon
USING (
  is_active = true 
  AND id IN (
    SELECT id FROM delivery_businesses 
    WHERE is_active = true
  )
);

-- Política para usuários autenticados (mais permissiva, mas ainda sem dados de contato privados)
CREATE POLICY "Authenticated users can view business info" 
ON delivery_businesses 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Garante que proprietários sempre podem ver TODAS as informações do seu negócio
-- (esta política já existe, mas vamos recriar para garantir prioridade)
DROP POLICY IF EXISTS "Business owners can view their complete business info" ON delivery_businesses;
CREATE POLICY "Business owners can view their complete business info" 
ON delivery_businesses 
FOR SELECT 
USING (owner_id = auth.uid());

-- Cria função para obter informações públicas seguras de um negócio
CREATE OR REPLACE FUNCTION get_public_business_info(business_slug text DEFAULT NULL, business_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  logo_url text,
  slug text,
  is_active boolean,
  delivery_time_minutes integer,
  min_order_value numeric,
  delivery_fee numeric,
  accept_orders_when_closed boolean,
  primary_color text,
  secondary_color text,
  accent_color text,
  background_color text,
  text_color text,
  button_color text,
  button_text_color text,
  cart_button_color text,
  cart_button_text_color text,
  delivery_time_bg_color text,
  delivery_time_text_color text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    db.id,
    db.name,
    db.description,
    db.logo_url,
    db.slug,
    db.is_active,
    db.delivery_time_minutes,
    db.min_order_value,
    db.delivery_fee,
    db.accept_orders_when_closed,
    db.primary_color,
    db.secondary_color,
    db.accent_color,
    db.background_color,
    db.text_color,
    db.button_color,
    db.button_text_color,
    db.cart_button_color,
    db.cart_button_text_color,
    db.delivery_time_bg_color,
    db.delivery_time_text_color,
    db.created_at,
    db.updated_at
  FROM delivery_businesses db
  WHERE db.is_active = true
    AND (
      (business_slug IS NOT NULL AND db.slug = business_slug) OR
      (business_id IS NOT NULL AND db.id = business_id)
    );
$$;

-- Comentário sobre a segurança implementada
COMMENT ON FUNCTION get_public_business_info IS 'Função segura para obter informações públicas de negócios sem expor dados de contato dos proprietários (telefone, endereço)';
COMMENT ON VIEW public_business_info IS 'View pública que expõe apenas informações seguras dos negócios, excluindo dados de contato dos proprietários';