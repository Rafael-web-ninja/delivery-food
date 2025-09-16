import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/formatters';
import { notificationStore } from '@/stores/notificationStore';
import { useNotificationSound } from '@/components/NotificationSound';

interface OrderNotification {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_code?: string;
}

export const useNotifications = () => {
  const { user, initialized } = useAuth();
  const { toast } = useToast();
  const { playNotificationSound } = useNotificationSound();
  const [notifications, setNotifications] = useState(notificationStore.getNotifications());
  const [newOrderModal, setNewOrderModal] = useState<{ order: OrderNotification | null; isOpen: boolean }>({
    order: null,
    isOpen: false
  });
  const [statusModal, setStatusModal] = useState<{ order: OrderNotification | null; isOpen: boolean }>({
    order: null,
    isOpen: false
  });

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
    if (!initialized) {
      console.log('⏳ Auth not initialized yet, waiting...');
      return;
    }

    if (!user?.id) {
      console.log('❌ No user, skipping notifications setup');
      return;
    }

    console.log('🔔 Setting up notifications for user:', user.id);

    let cleanupFn: (() => void) | undefined;

    const setupNotifications = async () => {
      try {
        // Check if user is business owner
        console.log('🔍 Checking if user is business owner...');
        const { data: business, error: businessError } = await supabase
          .from('delivery_businesses')
          .select('id, name')
          .eq('owner_id', user.id)
          .limit(1)
          .maybeSingle();

        if (businessError && businessError.code !== 'PGRST116') {
          console.error('❌ Error checking business:', businessError);
          return;
        }

        if (business?.id) {
          // Business owner notifications
          console.log('🏢 User is business owner. Business:', business.name, 'ID:', business.id);
          
          const channelName = `orders-business-${business.id}`;
          console.log('📡 Creating business channel:', channelName);
          
          const businessChannel = supabase
            .channel(channelName)
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'orders',
                filter: `business_id=eq.${business.id}`,
              },
              (payload) => {
                console.log('🎉 NEW ORDER received for business:', payload);
                const newOrder = payload.new as OrderNotification;
                
                // Add to notification store
                notificationStore.addNotification(newOrder);
                
                // Play notification sound
                playNotificationSound();
                
                // Show toast notification
                toast({
                  title: "🎉 Novo Pedido!",
                  description: `${newOrder.customer_name} fez um pedido de ${formatCurrency(Number(newOrder.total_amount))}`,
                  duration: 5000,
                });

                // Show modal popup
                setNewOrderModal({ order: newOrder, isOpen: true });

                console.log('✅ Business notification processed successfully');
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
                console.log('🔄 ORDER UPDATE received for business:', payload);
                const updatedOrder = payload.new as OrderNotification;
                notificationStore.updateNotification(updatedOrder);
                console.log('✅ Business order update processed');
              }
            )
            .subscribe((status) => {
              console.log('📡 Business channel subscription status:', status);
              if (status === 'SUBSCRIBED') {
                console.log('✅ Business notifications are ACTIVE!');
              } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ Business channel error!');
              } else if (status === 'TIMED_OUT') {
                console.error('⏰ Business channel timed out!');
              }
            });

          cleanupFn = () => {
            console.log('🛑 Cleaning up business notifications');
            supabase.removeChannel(businessChannel);
          };

        } else {
          // Customer notifications
          console.log('👤 Checking if user is customer...');
          const { data: customerProfile, error: customerError } = await supabase
            .from('customer_profiles')
            .select('id, name')
            .eq('user_id', user.id)
            .single();

          if (customerError || !customerProfile?.id) {
            console.log('❌ No customer profile found:', customerError);
            return;
          }

          console.log('👤 User is customer. Profile:', customerProfile.name, 'ID:', customerProfile.id);

          const channelName = `orders-customer-${customerProfile.id}`;
          console.log('📡 Creating customer channel:', channelName);

          const customerChannel = supabase
            .channel(channelName)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `customer_id=eq.${customerProfile.id}`,
              },
              (payload) => {
                console.log('🔄 ORDER STATUS UPDATE received for customer:', payload);
                const updatedOrder = payload.new as OrderNotification;
                
                // IMPORTANT: Customers DON'T add to notification store (no bell icon)
                // They only receive popup notifications

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

                  // Show status modal popup
                  setStatusModal({ order: updatedOrder, isOpen: true });
                }
                console.log('✅ Customer notification processed successfully');
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
                console.log('🆕 NEW ORDER received for customer:', payload);
                const newOrder = payload.new as OrderNotification;
                
                // IMPORTANT: Customers DON'T add to notification store (no bell icon)
                // They only receive real-time order updates for status changes
                
                console.log('✅ Customer order event processed (no store update needed)');
              }
            )
            .subscribe((status) => {
              console.log('📡 Customer channel subscription status:', status);
              if (status === 'SUBSCRIBED') {
                console.log('✅ Customer notifications are ACTIVE!');
              } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ Customer channel error!');
              } else if (status === 'TIMED_OUT') {
                console.error('⏰ Customer channel timed out!');
              }
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
  }, [user?.id, initialized, toast]);

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
    hasUnread: notificationStore.hasUnread(),
    newOrderModal,
    statusModal,
    closeNewOrderModal: () => setNewOrderModal({ order: null, isOpen: false }),
    closeStatusModal: () => setStatusModal({ order: null, isOpen: false })
  };
};