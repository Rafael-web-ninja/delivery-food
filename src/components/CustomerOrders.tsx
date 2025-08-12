import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { formatCurrency, statusTranslations } from '@/lib/formatters';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

interface Order {
  id: string;
  order_code?: string;
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
  preparing: { label: 'Em preparação', color: 'bg-orange-500' },
  out_for_delivery: { label: 'Saiu para entrega', color: 'bg-purple-500' },
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
      console.log('🔍 Buscando pedidos para usuário:', user?.id, user?.email);
      
      // Buscar o customer_id do cliente logado
      const { data: customerProfile, error: customerError } = await supabase
        .from('customer_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (customerError || !customerProfile) {
        console.error('Erro ao buscar customer_id:', customerError);
        setOrders([]);
        return;
      }

      console.log('👤 Customer profile encontrado:', customerProfile);

      // Buscar os pedidos do cliente
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_businesses!orders_delivery_id_fkey(id, name),
          order_items(
            quantity,
            menu_items(name)
          )
        `)
        .eq('customer_id', customerProfile.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Erro ao buscar pedidos:', ordersError);
        throw ordersError;
      } else {
        console.log('Pedidos do cliente:', orders);
      }

      setOrders((orders as any) || []);
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
                  <h3 className="font-semibold">#{order.order_code || order.id.slice(-8)} - {order.delivery_businesses.name}</h3>
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
                    {formatCurrency(Number(order.total_amount))}
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
                  className="hover:bg-primary hover:text-primary-foreground"
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