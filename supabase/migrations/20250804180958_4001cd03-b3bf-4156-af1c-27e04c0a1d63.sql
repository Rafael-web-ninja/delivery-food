-- Criar tabela para horários de funcionamento
CREATE TABLE public.business_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=domingo, 1=segunda, etc
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

-- Políticas para horários de funcionamento
CREATE POLICY "Anyone can view business hours" 
ON public.business_hours 
FOR SELECT 
USING (true);

CREATE POLICY "Business owners can manage their hours" 
ON public.business_hours 
FOR ALL 
USING (business_id = get_user_business_id());

-- Trigger para atualizar timestamps
CREATE TRIGGER update_business_hours_updated_at
BEFORE UPDATE ON public.business_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela de perfis de usuários clientes
CREATE TABLE public.customer_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para perfis de clientes
CREATE POLICY "Users can view their own profile" 
ON public.customer_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.customer_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.customer_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger para perfis de clientes
CREATE TRIGGER update_customer_profiles_updated_at
BEFORE UPDATE ON public.customer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar coluna user_id na tabela orders para associar pedidos a usuários
ALTER TABLE public.orders ADD COLUMN user_id UUID;