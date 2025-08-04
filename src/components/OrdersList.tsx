import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Phone, MapPin, CheckCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  total_amount: number;
  status: string;
  payment_method: string;
  notes?: string;
  created_at: string;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    menu_item_id: string;
    menu_items: {
      name: string;
    };
  }>;
}

interface OrdersListProps {
  orders: Order[];
  onStatusUpdate: (orderId: string, status: string) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  preparing: 'bg-blue-500',
  ready: 'bg-green-500',
  delivered: 'bg-gray-500'
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  preparing: 'Preparando',
  ready: 'Pronto',
  delivered: 'Entregue'
};

export function OrdersList({ orders, onStatusUpdate }: OrdersListProps) {
  const nextStatus: Record<string, string> = {
    pending: 'preparing',
    preparing: 'ready',
    ready: 'delivered',
    delivered: 'delivered'
  };

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum pedido encontrado</p>
        </div>
      ) : (
        orders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    #{order.id.slice(-8)}
                    <Badge className={`${statusColors[order.status]} text-white`}>
                      {statusLabels[order.status]}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(order.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {order.customer_phone}
                    </span>
                    {order.customer_address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {order.customer_address}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    R$ {Number(order.total_amount).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.payment_method}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Cliente: {order.customer_name}</h4>
                  <div className="space-y-1">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.menu_items.name}
                        </span>
                        <span>R$ {(item.quantity * Number(item.unit_price)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.notes && (
                  <div className="bg-muted p-3 rounded-md">
                    <h5 className="font-medium text-sm mb-1">Observações:</h5>
                    <p className="text-sm">{order.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {order.status !== 'delivered' && (
                    <Button
                      onClick={() => onStatusUpdate(order.id, nextStatus[order.status])}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {order.status === 'pending' && 'Iniciar Preparo'}
                      {order.status === 'preparing' && 'Marcar Pronto'}
                      {order.status === 'ready' && 'Marcar Entregue'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}