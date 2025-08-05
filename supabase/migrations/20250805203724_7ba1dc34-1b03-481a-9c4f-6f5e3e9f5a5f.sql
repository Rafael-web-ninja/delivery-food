-- Criar edge function para configurar usuário após cadastro
CREATE OR REPLACE FUNCTION public.setup_new_user()
RETURNS TRIGGER 
LANGUAGE PLPGSQL 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Inserir role padrão (cliente) para novos usuários
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente'::user_role)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Criar perfil de cliente para novos usuários
  INSERT INTO public.customer_profiles (user_id, name, phone, address)
  VALUES (NEW.id, 
          COALESCE(NEW.raw_user_meta_data->>'name', ''),
          COALESCE(NEW.raw_user_meta_data->>'phone', ''),
          '')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para executar a função quando um usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.setup_new_user();

-- Garantir que a coluna user_id seja única na tabela user_roles
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- Garantir que a coluna user_id seja única na tabela customer_profiles  
ALTER TABLE public.customer_profiles 
ADD CONSTRAINT customer_profiles_user_id_unique UNIQUE (user_id);