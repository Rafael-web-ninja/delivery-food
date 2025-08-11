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

    // Get user's business (owner) and customer profile in parallel
    const [{ data: business }, { data: customerProfile }] = await Promise.all([
      supabase.from('delivery_businesses').select('id').eq('owner_id', user.id).single(),
      supabase.from('customer_profiles').select('id').eq('user_id', user.id).single(),
    ]);

    // If user is a customer (no business), subscribe to their order updates
    if (!business?.id) {
      if (!customerProfile?.id) return;

      const customerChannel = supabase
        .channel(`orders-notifications-customer-${customerProfile.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `customer_id=eq.${customerProfile.id}` },
          (payload) => {
            const updatedOrder = payload.new as OrderNotification;
            setNotifications(prev => {
              const exists = prev.some(n => n.id === updatedOrder.id);
              return (exists
                ? prev.map(n => (n.id === updatedOrder.id ? updatedOrder : n))
                : [updatedOrder, ...prev]
              ).slice(0, 10);
            });

            switch (updatedOrder.status) {
              case 'preparing':
                toast({ title: '👨‍🍳 Em preparação', description: 'Seu pedido está em preparação.', duration: 3000 });
                break;
              case 'ready':
                toast({ title: '📦 Pronto para retirada/entrega', description: 'Seu pedido está pronto.', duration: 3000 });
                break;
              case 'out_for_delivery':
                toast({ title: '🛵 Saiu para entrega', description: 'Seu pedido saiu para entrega.', duration: 3000 });
                break;
              case 'delivered':
                toast({ title: '✅ Pedido entregue', description: 'Seu pedido foi entregue.', duration: 3000 });
                break;
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(customerChannel);
      };
    }

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

          // For business owners: update the list silently (no status toasts)
          // We keep only the INSERT toast above for new orders.
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