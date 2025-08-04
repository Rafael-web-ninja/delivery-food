import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
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

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  payment_method: string;
  status: string;
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
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
};

const statusColors = {
  pending: 'destructive',
  preparing: 'default',
  ready: 'secondary',
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
  const { user } = useAuth();
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus as any })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Status atualizado!",
        description: `Pedido alterado para: ${statusTranslations[newStatus as keyof typeof statusTranslations]}`
      });

      fetchOrders();
    } catch (error: any) {
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
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Gerenciar Pedidos</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe e atualize o status dos pedidos
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">Todos ({orders.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pendentes ({orders.filter(o => o.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="preparing">
              Preparando ({orders.filter(o => o.status === 'preparing').length})
            </TabsTrigger>
            <TabsTrigger value="ready">
              Prontos ({orders.filter(o => o.status === 'ready').length})
            </TabsTrigger>
            <TabsTrigger value="delivered">
              Entregues ({orders.filter(o => o.status === 'delivered').length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <OrdersList orders={orders} onStatusUpdate={updateOrderStatus} />
          </TabsContent>
          
          <TabsContent value="pending">
            <OrdersList orders={orders.filter(o => o.status === 'pending')} onStatusUpdate={updateOrderStatus} />
          </TabsContent>
          
          <TabsContent value="preparing">
            <OrdersList orders={orders.filter(o => o.status === 'preparing')} onStatusUpdate={updateOrderStatus} />
          </TabsContent>
          
          <TabsContent value="ready">
            <OrdersList orders={orders.filter(o => o.status === 'ready')} onStatusUpdate={updateOrderStatus} />
          </TabsContent>
          
          <TabsContent value="delivered">
            <OrdersList orders={orders.filter(o => o.status === 'delivered')} onStatusUpdate={updateOrderStatus} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default OrderManagement;