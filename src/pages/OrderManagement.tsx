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
        .update({ status: newStatus as 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Status atualizado!",
        description: `Pedido alterado para: ${statusTranslations[newStatus as 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled']}`
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Pedidos ({orders.length})</h2>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Nenhum pedido encontrado
            </p>
            <p className="text-sm text-muted-foreground">
              Os pedidos aparecerão aqui quando clientes fizerem pedidos
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {order.customer_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDateTime(order.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          R$ {order.total_amount.toFixed(2)}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={statusColors[order.status as keyof typeof statusColors]}>
                        {statusTranslations[order.status as keyof typeof statusTranslations]}
                      </Badge>
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="preparing">Em Preparação</SelectItem>
                          <SelectItem value="out_for_delivery">Saiu para Entrega</SelectItem>
                          <SelectItem value="delivered">Entregue</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{order.customer_phone}</span>
                      </div>
                      {order.customer_address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{order.customer_address}</span>
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="font-medium">Pagamento: </span>
                        {paymentMethodTranslations[order.payment_method as keyof typeof paymentMethodTranslations]}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Itens do Pedido:</h4>
                      <div className="space-y-1">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="text-sm flex justify-between">
                            <span>{item.quantity}x {item.menu_items.name}</span>
                            <span>R$ {item.total_price.toFixed(2)}</span>
                          </div>
                        ))}
                        {order.delivery_fee > 0 && (
                          <div className="text-sm flex justify-between border-t pt-1">
                            <span>Taxa de entrega</span>
                            <span>R$ {order.delivery_fee.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="text-sm flex justify-between font-bold border-t pt-1">
                          <span>Total</span>
                          <span>R$ {order.total_amount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium mb-1">Observações:</p>
                      <p className="text-sm">{order.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderManagement;