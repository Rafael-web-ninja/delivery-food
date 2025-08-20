
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/formatters';
import { notificationStore } from '@/stores/notificationStore';

interface OrderNotification {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_code?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(notificationStore.getNotifications());

  // Subscribe to store changes with proper cleanup
  useEffect(() => {
    const unsubscribe = notificationStore.subscribe(() => {
      setNotifications(notificationStore.getNotifications());
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      console.log('❌ No user, skipping notifications setup');
      return;
    }

    let cleanupFn: (() => void) | undefined;

    const setupNotifications = async () => {
      console.log('🔔 Setting up notifications for user:', user.id);

      try {
        // Check if user is business owner
        const { data: business, error: businessError } = await supabase
          .from('delivery_businesses')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (businessError && businessError.code !== 'PGRST116') {
          console.error('❌ Error checking business:', businessError);
          return;
        }

        if (business?.id) {
          // Business owner notifications
          console.log('🏢 Setting up business owner notifications for business:', business.id);
          
          const businessChannel = supabase
            .channel(`orders-owner-${business.id}`)
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'orders',
                filter: `business_id=eq.${business.id}`,
              },
              (payload) => {
                console.log('🎉 New order for business owner:', payload);
                const newOrder = payload.new as OrderNotification;
                
                notificationStore.addNotification(newOrder);
                
                toast({
                  title: "🎉 Novo Pedido!",
                  description: `${newOrder.customer_name} fez um pedido de ${formatCurrency(Number(newOrder.total_amount))}`,
                  duration: 5000,
                });

                // Play notification sound
                try {
                  const audio = new Audio('/notification.mp3');
                  audio.play().catch(() => {});
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
                console.log('🔄 Order update for business owner:', payload);
                const updatedOrder = payload.new as OrderNotification;
                notificationStore.updateNotification(updatedOrder);
              }
            )
            .subscribe((status) => {
              console.log('Business channel subscription status:', status);
            });

          cleanupFn = () => {
            console.log('🛑 Cleaning up business owner notifications');
            supabase.removeChannel(businessChannel);
          };
        } else {
          // Customer notifications
          const { data: customerProfile, error: customerError } = await supabase
            .from('customer_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (customerError || !customerProfile?.id) {
            console.log('❌ No customer profile found:', customerError);
            return;
          }

          console.log('👤 Setting up customer notifications for customer:', customerProfile.id);

          const customerChannel = supabase
            .channel(`orders-customer-${customerProfile.id}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `customer_id=eq.${customerProfile.id}`,
              },
              (payload) => {
                console.log('🔄 Order update for customer:', payload);
                const updatedOrder = payload.new as OrderNotification;
                
                notificationStore.updateNotification(updatedOrder);

                // Show status change toasts for customers
                const statusMessages = {
                  'preparing': { title: '👨‍🍳 Em preparação', description: 'Seu pedido está sendo preparado.' },
                  'ready': { title: '📦 Pronto!', description: 'Seu pedido está pronto para retirada/entrega.' },
                  'out_for_delivery': { title: '🛵 Saiu para entrega', description: 'Seu pedido saiu para entrega.' },
                  'delivered': { title: '✅ Entregue', description: 'Seu pedido foi entregue com sucesso!' },
                  'cancelled': { title: '❌ Cancelado', description: 'Seu pedido foi cancelado.' },
                  'rejected': { title: '🚫 Rejeitado', description: 'Seu pedido foi rejeitado.' }
                };

                const statusInfo = statusMessages[updatedOrder.status as keyof typeof statusMessages];
                if (statusInfo) {
                  toast({
                    title: statusInfo.title,
                    description: statusInfo.description,
                    duration: 4000,
                  });
                }
              }
            )
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'orders',
                filter: `customer_id=eq.${customerProfile.id}`,
              },
              (payload) => {
                console.log('🆕 New order for customer:', payload);
                const newOrder = payload.new as OrderNotification;
                notificationStore.addNotification(newOrder);
              }
            )
            .subscribe((status) => {
              console.log('Customer channel subscription status:', status);
            });

          cleanupFn = () => {
            console.log('🛑 Cleaning up customer notifications');
            supabase.removeChannel(customerChannel);
          };
        }
      } catch (error) {
        console.error('❌ Error setting up notifications:', error);
      }
    };

    setupNotifications();

    return () => {
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [user?.id, toast]);

  const markAsRead = (orderId: string) => {
    notificationStore.removeNotification(orderId);
  };

  const clearAll = () => {
    notificationStore.clearAll();
  };

  return {
    notifications,
    markAsRead,
    clearAll,
    hasUnread: notificationStore.hasUnread()
  };
};
