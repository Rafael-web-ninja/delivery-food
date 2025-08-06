import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Order {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_businesses: {
    name: string;
  };
  order_items: Array<{
    quantity: number;
    menu_items: {
      name: string;
    };
  }>;
}

const statusMap = {
  pending: { label: 'Pendente', color: 'bg-yellow-500' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-500' },
  preparing: { label: 'Preparando', color: 'bg-orange-500' },
  ready: { label: 'Pronto', color: 'bg-green-500' },
  delivered: { label: 'Entregue', color: 'bg-gray-500' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500' }
};

export default function CustomerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_businesses!inner(name),
          order_items(
            quantity,
            menu_items(name)
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meus Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando pedidos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meus Pedidos</CardTitle>
          <CardDescription>Você ainda não fez nenhum pedido</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Quando você fizer pedidos, eles aparecerão aqui.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus Pedidos</CardTitle>
        <CardDescription>Histórico dos seus pedidos realizados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {orders.map((order) => {
          const status = statusMap[order.status as keyof typeof statusMap] || statusMap.pending;
          
          return (
            <div key={order.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{order.delivery_businesses.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(order.created_at), { 
                      addSuffix: true,
                      locale: ptBR 
                    })}
                  </p>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`${status.color} text-white`}
                >
                  {status.label}
                </Badge>
              </div>
              
              <div className="space-y-1">
                {order.order_items.map((item, index) => (
                  <p key={index} className="text-sm">
                    {item.quantity}x {item.menu_items.name}
                  </p>
                ))}
              </div>
              
              <div className="text-right">
                <p className="font-semibold">
                  Total: R$ {Number(order.total_amount).toFixed(2)}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}