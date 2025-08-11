import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/formatters';

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

    const setupNotifications = async () => {

    // Get user's business ID first
    const { data: business } = await supabase
      .from('delivery_businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!business?.id) return;

    // Subscribe to new orders
    const channel = supabase
      .channel('orders-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          const newOrder = payload.new as OrderNotification;
          
          // Add to notifications
          setNotifications(prev => [newOrder, ...prev.slice(0, 9)]); // Keep last 10
          
          // Show toast notification
          toast({
            title: "🎉 Novo Pedido!",
            description: `${newOrder.customer_name} fez um pedido de ${formatCurrency(Number(newOrder.total_amount))}`,
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
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          const updatedOrder = payload.new as OrderNotification;
          
          // Update notifications list
          setNotifications(prev => 
            prev.map(notif => 
              notif.id === updatedOrder.id ? updatedOrder : notif
            )
          );

          // Show status update notification for key statuses
          switch (updatedOrder.status) {
            case 'preparing':
              toast({
                title: "👨‍🍳 Em preparação",
                description: `Pedido de ${updatedOrder.customer_name} está em preparação.`,
                duration: 3000,
              });
              break;
            case 'ready':
              toast({
                title: "📦 Pronto para entrega",
                description: `Pedido de ${updatedOrder.customer_name} está pronto para entrega.`,
                duration: 3000,
              });
              break;
            case 'out_for_delivery':
              toast({
                title: "🛵 Saiu para entrega",
                description: `Pedido de ${updatedOrder.customer_name} saiu para entrega.`,
                duration: 3000,
              });
              break;
            case 'delivered':
              toast({
                title: "✅ Pedido entregue",
                description: `Pedido de ${updatedOrder.customer_name} foi entregue.`,
                duration: 3000,
              });
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    };

    setupNotifications();
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