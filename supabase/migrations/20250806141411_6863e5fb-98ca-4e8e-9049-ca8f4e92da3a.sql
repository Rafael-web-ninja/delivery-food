-- Fix complete login system, orders RLS, and customer registration
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Customer can view their orders" ON orders;
DROP POLICY IF EXISTS "Delivery owners can view their orders" ON orders;
DROP POLICY IF EXISTS "Business owners can view their delivery orders" ON orders;
DROP POLICY IF EXISTS "Customers can view their own orders" ON orders;

-- Create correct RLS policies for orders
CREATE POLICY "Customer can view their own orders"
ON orders
FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM customer_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Delivery owners can view their delivery orders"
ON orders
FOR SELECT
USING (
  business_id IN (
    SELECT id FROM delivery_businesses WHERE owner_id = auth.uid()
  )
);

-- Ensure customer_profiles has correct policies
DROP POLICY IF EXISTS "Users can view their own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON customer_profiles;

CREATE POLICY "Users can view their own profile"
ON customer_profiles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON customer_profiles
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON customer_profiles
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Ensure delivery_businesses has correct policies
DROP POLICY IF EXISTS "Users can view their own business" ON delivery_businesses;
DROP POLICY IF EXISTS "Users can update their own business" ON delivery_businesses;
DROP POLICY IF EXISTS "Users can insert their own business" ON delivery_businesses;
DROP POLICY IF EXISTS "Anyone can view active businesses" ON delivery_businesses;

CREATE POLICY "Users can view their own business"
ON delivery_businesses
FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Users can update their own business"
ON delivery_businesses
FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own business"
ON delivery_businesses
FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Anyone can view active businesses"
ON delivery_businesses
FOR SELECT
USING (is_active = true);

-- Update the setup_new_user function to handle both customer and delivery owner registration
CREATE OR REPLACE FUNCTION public.setup_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Inserir role padrão para novos usuários
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente'::user_role)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Verificar o tipo de usuário pelos metadados
  IF NEW.raw_user_meta_data->>'user_type' = 'customer' THEN
    -- Criar perfil de cliente
    INSERT INTO public.customer_profiles (user_id, name, phone, address)
    VALUES (NEW.id, 
            COALESCE(NEW.raw_user_meta_data->>'name', ''),
            COALESCE(NEW.raw_user_meta_data->>'phone', ''),
            '')
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF NEW.raw_user_meta_data->>'user_type' = 'delivery_owner' THEN
    -- Criar delivery business para donos de delivery
    INSERT INTO public.delivery_businesses (owner_id, name, description)
    VALUES (NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'name', 'Meu Delivery'),
            'Descrição do negócio')
    ON CONFLICT (owner_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;