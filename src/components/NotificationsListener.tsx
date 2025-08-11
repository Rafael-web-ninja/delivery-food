import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';

// Renders nothing; ensures customer users receive realtime toasts anywhere in the app
const CustomerNotifications = () => {
  useNotifications();
  return null;
};

const NotificationsListener = () => {
  const { user } = useAuth();
  const [isOwner, setIsOwner] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      if (!user?.id) {
        if (mounted) setIsOwner(null);
        return;
      }
      try {
        const { data: business } = await supabase
          .from('delivery_businesses')
          .select('id')
          .eq('owner_id', user.id)
          .single();
        if (mounted) setIsOwner(!!business?.id);
      } catch {
        if (mounted) setIsOwner(false);
      }
    };
    check();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  if (isOwner === null) return null;
  return isOwner ? null : <CustomerNotifications />;
};

export default NotificationsListener;
