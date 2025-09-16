-- Add delivery radius field to delivery_businesses table
ALTER TABLE public.delivery_businesses 
ADD COLUMN delivery_radius_km numeric DEFAULT 10;

COMMENT ON COLUMN public.delivery_businesses.delivery_radius_km IS 'Delivery radius in kilometers for ZIP code validation';

-- Add delivery area ZIP codes table to store valid ZIP codes for each business
CREATE TABLE public.delivery_areas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.delivery_businesses(id) ON DELETE CASCADE,
  zip_code text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(business_id, zip_code)
);

-- Enable RLS
ALTER TABLE public.delivery_areas ENABLE ROW LEVEL SECURITY;

-- Create policies for delivery areas
CREATE POLICY "Business owners can manage their delivery areas" 
ON public.delivery_areas 
FOR ALL 
USING (business_id = get_user_business_id());

CREATE POLICY "Public can view active delivery areas" 
ON public.delivery_areas 
FOR SELECT 
USING (business_id IN (
  SELECT id FROM public.delivery_businesses WHERE is_active = true
));

-- Create trigger for updated_at
CREATE TRIGGER update_delivery_areas_updated_at
  BEFORE UPDATE ON public.delivery_areas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();