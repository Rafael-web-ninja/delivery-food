-- Create storage bucket for menu item images
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true);

-- Create menu_categories table
CREATE TABLE public.menu_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.delivery_businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu_items table
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.delivery_businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  preparation_time INTEGER DEFAULT 0, -- em minutos
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled');

-- Create payment method enum
CREATE TYPE public.payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'pix', 'food_voucher');

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.delivery_businesses(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  payment_method payment_method NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  delivery_fee DECIMAL(10,2) DEFAULT 0 CHECK (delivery_fee >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for menu_categories
CREATE POLICY "Business owners can manage their categories" ON public.menu_categories
FOR ALL USING (business_id = public.get_user_business_id());

CREATE POLICY "Anyone can view active categories" ON public.menu_categories
FOR SELECT USING (active = true);

-- RLS Policies for menu_items
CREATE POLICY "Business owners can manage their menu items" ON public.menu_items
FOR ALL USING (business_id = public.get_user_business_id());

CREATE POLICY "Anyone can view active menu items" ON public.menu_items
FOR SELECT USING (active = true);

-- RLS Policies for orders
CREATE POLICY "Business owners can manage their orders" ON public.orders
FOR ALL USING (business_id = public.get_user_business_id());

-- RLS Policies for order_items
CREATE POLICY "Business owners can view their order items" ON public.order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_items.order_id 
    AND o.business_id = public.get_user_business_id()
  )
);

-- Create storage policies for menu images
CREATE POLICY "Anyone can view menu images" ON storage.objects
FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "Business owners can upload menu images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'menu-images' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Business owners can update their menu images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'menu-images' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Business owners can delete their menu images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'menu-images' AND
  auth.uid() IS NOT NULL
);

-- Create triggers for updated_at
CREATE TRIGGER update_menu_categories_updated_at
BEFORE UPDATE ON public.menu_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_menu_categories_business_id ON public.menu_categories(business_id);
CREATE INDEX idx_menu_items_business_id ON public.menu_items(business_id);
CREATE INDEX idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX idx_orders_business_id ON public.orders(business_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- Enable realtime for orders (so business owners get real-time notifications)
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;