import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/formatters';
import { useState, useEffect } from 'react';
import { notificationStore } from '@/stores/notificationStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(notificationStore.getNotifications());
  const [hasUnread, setHasUnread] = useState(notificationStore.hasUnread());
  const [isBusinessOwner, setIsBusinessOwner] = useState<boolean | null>(null);

  console.log('🔔 NotificationBell render - user:', user?.id || 'none', 'notifications:', notifications.length, 'hasUnread:', hasUnread);

  // Check if user is business owner
  useEffect(() => {
    const checkBusinessOwner = async () => {
      if (!user?.id) {
        setIsBusinessOwner(null);
        return;
      }

      try {
        const { data: business, error } = await supabase
          .from('delivery_businesses')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        setIsBusinessOwner(!!business?.id);
      } catch (error) {
        console.error('Error checking business owner:', error);
        setIsBusinessOwner(false);
      }
    };

    checkBusinessOwner();
  }, [user?.id]);

  // Subscribe to store changes with proper cleanup
  useEffect(() => {
    const unsubscribe = notificationStore.subscribe(() => {
      const newNotifications = notificationStore.getNotifications();
      const newHasUnread = notificationStore.hasUnread();
      console.log('🔔 NotificationBell store update - count:', newNotifications.length, 'hasUnread:', newHasUnread);
      setNotifications(newNotifications);
      setHasUnread(newHasUnread);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  const markAsRead = (orderId: string) => {
    console.log('👁️ Marking notification as read:', orderId);
    notificationStore.removeNotification(orderId);
  };

  const clearAll = () => {
    console.log('🧹 Clearing all notifications');
    notificationStore.clearAll();
  };

  const handleNotificationClick = (notification: any) => {
    console.log('🖱️ Notification clicked:', notification.id);
    markAsRead(notification.id);
    
    // Navigate to orders page
    if (typeof window !== 'undefined') {
      window.location.href = '/orders';
    }
  };

  // Don't render if no user or not a business owner
  if (!user || isBusinessOwner === false) {
    console.log('🔔 NotificationBell - No user or not business owner, not rendering');
    return null;
  }

  // Don't render while still checking
  if (isBusinessOwner === null) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {hasUnread && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 text-xs rounded-full flex items-center justify-center min-w-[20px] p-0 border-2 border-background bg-red-600 hover:bg-red-600 text-white"
            >
              {notifications.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notificações ({notifications.length})
          {hasUnread && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAll}
              className="text-xs h-auto p-1"
            >
              Limpar todas
            </Button>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="max-h-64">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-3 cursor-pointer hover:bg-muted"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="font-medium text-sm">
                  Pedido - {notification.customer_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(Number(notification.total_amount))} • {' '}
                  {new Date(notification.created_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {notification.order_code && ` • #${notification.order_code}`}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Status: {notification.status}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};