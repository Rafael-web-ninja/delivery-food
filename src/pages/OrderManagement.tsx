import { useState, useEffect } from 'react';
import { useAuthWithRole } from '@/hooks/useAuthWithRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, Phone, MapPin, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrdersList } from '@/components/OrdersList';

type OrderStatus = 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  payment_method: string;
  status: OrderStatus;
  total_amount: number;
  delivery_fee: number;
  notes: string;
  created_at: string;
  order_items: OrderItem[];
}

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string;
  menu_item_id: string;
  menu_items: {
    name: string;
  };
}

const statusTranslations = {
  pending: 'Pendente',
  preparing: 'Em Preparação',
  out_for_delivery: 'Saiu para Entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
};

const statusColors = {
  pending: 'destructive',
  preparing: 'default',
  out_for_delivery: 'secondary',
  delivered: 'default',
  cancelled: 'outline'
} as const;

const paymentMethodTranslations = {
  cash: 'Dinheiro',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  food_voucher: 'Vale Alimentação'
};

const OrderManagement = () => {
  const { user } = useAuthWithRole();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setOrders(data);
    } catch (error: any) {
      console.error('Erro ao buscar pedidos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pedidos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // Validar status antes de enviar
      const validStatuses = ['pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error('Status inválido');
      }

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Status atualizado!",
        description: `Pedido alterado para: ${statusTranslations[newStatus as keyof typeof statusTranslations]}`
      });

      fetchOrders();
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Pedidos</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe e atualize o status dos pedidos
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">Todos ({orders.length})</TabsTrigger>
          <TabsTrigger value="today">
            Hoje ({orders.filter(o => {
              const today = new Date().toDateString();
              const orderDate = new Date(o.created_at).toDateString();
              return today === orderDate;
            }).length})
          </TabsTrigger>
          <TabsTrigger value="week">
            Semana ({orders.filter(o => {
              const oneWeekAgo = new Date();
              oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
              return new Date(o.created_at) >= oneWeekAgo;
            }).length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes ({orders.filter(o => o.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="preparing">
            Preparando ({orders.filter(o => o.status === 'preparing').length})
          </TabsTrigger>
          <TabsTrigger value="out_for_delivery">
            Saindo ({orders.filter(o => o.status === 'out_for_delivery').length})
          </TabsTrigger>
          <TabsTrigger value="delivered">
            Entregues ({orders.filter(o => o.status === 'delivered').length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <OrdersList orders={orders} onStatusUpdate={updateOrderStatus} />
        </TabsContent>
        
        <TabsContent value="today">
          <OrdersList 
            orders={orders.filter(o => {
              const today = new Date().toDateString();
              const orderDate = new Date(o.created_at).toDateString();
              return today === orderDate;
            })} 
            onStatusUpdate={updateOrderStatus} 
          />
        </TabsContent>
        
        <TabsContent value="pending">
          <OrdersList orders={orders.filter(o => o.status === 'pending')} onStatusUpdate={updateOrderStatus} />
        </TabsContent>
        
        <TabsContent value="preparing">
          <OrdersList orders={orders.filter(o => o.status === 'preparing')} onStatusUpdate={updateOrderStatus} />
        </TabsContent>
        
        <TabsContent value="out_for_delivery">
          <OrdersList orders={orders.filter(o => o.status === 'out_for_delivery')} onStatusUpdate={updateOrderStatus} />
        </TabsContent>
        
        <TabsContent value="week">
          <OrdersList 
            orders={orders.filter(o => {
              const oneWeekAgo = new Date();
              oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
              return new Date(o.created_at) >= oneWeekAgo;
            })} 
            onStatusUpdate={updateOrderStatus} 
          />
        </TabsContent>
        
        <TabsContent value="delivered">
          <OrdersList orders={orders.filter(o => o.status === 'delivered')} onStatusUpdate={updateOrderStatus} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderManagement;