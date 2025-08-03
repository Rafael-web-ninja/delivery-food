-- Insert demo user first
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'admin@deliveryfacil.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"business_name": "Demo Delivery"}'
) ON CONFLICT (id) DO NOTHING;

-- Create delivery_businesses table
CREATE TABLE public.delivery_businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert demo business
INSERT INTO public.delivery_businesses (owner_id, name, description, phone)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Demo Delivery',
  'Delivery de demonstração',
  '(11) 99999-9999'
);

-- Update get_user_business_id function
CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS UUID AS $$
  SELECT id FROM public.delivery_businesses WHERE owner_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Enable RLS
ALTER TABLE public.delivery_businesses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own business" ON public.delivery_businesses
FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can update their own business" ON public.delivery_businesses
FOR UPDATE USING (owner_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_delivery_businesses_updated_at
BEFORE UPDATE ON public.delivery_businesses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();