import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface OrderNotification {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to new orders
    const channel = supabase
      .channel('orders-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `business_id=eq.${user.id}`,
        },
        (payload) => {
          const newOrder = payload.new as OrderNotification;
          
          // Add to notifications
          setNotifications(prev => [newOrder, ...prev.slice(0, 9)]); // Keep last 10
          
          // Show toast notification
          toast({
            title: "🎉 Novo Pedido!",
            description: `${newOrder.customer_name} fez um pedido de R$ ${Number(newOrder.total_amount).toFixed(2)}`,
            duration: 5000,
          });

          // Play notification sound (optional)
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {
              // Ignore if audio fails to play
            });
          } catch (error) {
            // Ignore audio errors
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `business_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedOrder = payload.new as OrderNotification;
          
          // Update notifications list
          setNotifications(prev => 
            prev.map(notif => 
              notif.id === updatedOrder.id ? updatedOrder : notif
            )
          );

          // Show status update notification
          if (updatedOrder.status === 'completed') {
            toast({
              title: "✅ Pedido Concluído",
              description: `Pedido de ${updatedOrder.customer_name} foi finalizado`,
              duration: 3000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, toast]);

  const markAsRead = (orderId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== orderId));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    markAsRead,
    clearAll,
    hasUnread: notifications.length > 0
  };
};