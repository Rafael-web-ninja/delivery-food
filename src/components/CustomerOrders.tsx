import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

interface Order {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_businesses: {
    id: string;
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
      // 1. Buscar customer_id do customer_profiles usando auth.uid()
      const { data: customerProfile, error: customerError } = await supabase
        .from('customer_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (customerError) {
        throw customerError;
      }

      if (!customerProfile) {
        console.log('Perfil de cliente não encontrado');
        setOrders([]);
        setLoading(false);
        return;
      }

      // 2. Buscar pedidos usando customer_id
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_businesses!inner(id, name),
          order_items(
            quantity,
            menu_items(name)
          )
        `)
        .eq('customer_id', customerProfile.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setOrders((data as any) || []);
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
            <p className="text-muted-foreground">Você ainda não fez nenhum pedido. Comece escolhendo seu cardápio favorito!</p>
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
                  <h3 className="font-semibold">#{order.id.slice(-8)} - {order.delivery_businesses.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(order.created_at), { 
                      addSuffix: true,
                      locale: ptBR 
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <Badge 
                    variant="secondary" 
                    className={`${status.color} text-white mb-2`}
                  >
                    {status.label}
                  </Badge>
                  <p className="font-semibold">
                    R$ {Number(order.total_amount).toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-medium text-sm">Itens do pedido:</h4>
                {order.order_items.map((item, index) => (
                  <p key={index} className="text-sm">
                    {item.quantity}x {item.menu_items.name}
                  </p>
                ))}
              </div>
              
              <div className="pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`/public-menu/${order.delivery_businesses.id}`, '_blank')}
                >
                  Ver Cardápio
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}