import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Phone, MapPin, CheckCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatCurrency, statusTranslations, paymentTranslations } from '@/lib/formatters';
import { ptBR } from 'date-fns/locale';
import { ThermalPrint } from './ThermalPrint';

interface Order {
  id: string;
  order_code?: string;
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
    notes?: string | null;
    menu_items: {
      name: string;
    };
  }>;
}

interface OrdersListProps {
  orders: Order[];
  onStatusUpdate: (orderId: string, status: string) => void;
  businessName?: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  preparing: 'bg-blue-500',
  out_for_delivery: 'bg-green-500',
  delivered: 'bg-gray-500',
  cancelled: 'bg-red-500'
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  preparing: 'Preparando',
  out_for_delivery: 'Saiu para Entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
};

export function OrdersList({ orders, onStatusUpdate, businessName = "Delivery" }: OrdersListProps) {
  const nextStatus: Record<string, string> = {
    pending: 'preparing',
    preparing: 'out_for_delivery',
    out_for_delivery: 'delivered',
    delivered: 'delivered',
    cancelled: 'cancelled'
  };

  const getNextStatusLabel = (status: string) => {
    if (status === 'pending') return 'Iniciar Preparo';
    if (status === 'preparing') return 'Marcar Pronto';
    if (status === 'out_for_delivery') return 'Marcar Entregue';
    return 'Concluir';
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
                    #{order.order_code || order.id.slice(-8)}
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
                    {formatCurrency(Number(order.total_amount))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {paymentTranslations[order.payment_method as keyof typeof paymentTranslations] || order.payment_method}
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
                        <div>
                          <div>{item.quantity}x {item.menu_items?.name || 'Item'}</div>
                          {item.notes && (
                            <div className="text-xs text-muted-foreground">
                              {item.notes}
                            </div>
                          )}
                        </div>
                        <span>{formatCurrency(item.quantity * Number(item.unit_price))}</span>
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
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <Button
                      onClick={() => onStatusUpdate(order.id, nextStatus[order.status])}
                      className="flex-1"
                      variant="default"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {getNextStatusLabel(order.status)}
                    </Button>
                  )}
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <Button
                      onClick={() => onStatusUpdate(order.id, 'cancelled')}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <ThermalPrint order={order} businessName={businessName} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}