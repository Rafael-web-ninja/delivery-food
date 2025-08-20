import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';

// Renders nothing; ensures all authenticated users receive realtime notifications
const NotificationsListener = () => {
  const { user } = useAuth();
  
  // Always use notifications hook for any authenticated user
  // The hook internally handles both business owner and customer notifications
  useNotifications();
  
  console.log('👂 NotificationsListener mounted for user:', user?.id || 'none');
  
  return null;
};

export default NotificationsListener;
