-- Create function to send welcome email after user creation from checkout
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_checkout()
RETURNS trigger AS $$
DECLARE
  temp_password text;
BEGIN
  -- Only send welcome email if user was created via checkout (has subscription_created metadata)
  IF NEW.raw_user_meta_data->>'subscription_created' = 'true' THEN
    -- Generate random password for new users
    temp_password := substr(md5(random()::text), 1, 12);
    
    -- Use pg_net to call our edge function (if available) or log for manual processing
    -- This is a fallback since we can't guarantee pg_net is enabled
    INSERT INTO public.auth_notifications (
      user_id,
      email,
      notification_type,
      temporary_password,
      created_at
    ) VALUES (
      NEW.id,
      NEW.email,
      'welcome_email',
      temp_password,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create table to track auth notifications that need to be sent
CREATE TABLE IF NOT EXISTS public.auth_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  temporary_password TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on auth_notifications
ALTER TABLE public.auth_notifications ENABLE ROW LEVEL SECURITY;

-- Only allow service role to manage these notifications
CREATE POLICY "Service role can manage auth notifications" ON public.auth_notifications
FOR ALL USING (auth.role() = 'service_role');

-- Create trigger to send welcome email on user creation
DROP TRIGGER IF EXISTS send_welcome_email_trigger ON auth.users;
CREATE TRIGGER send_welcome_email_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email_on_checkout();