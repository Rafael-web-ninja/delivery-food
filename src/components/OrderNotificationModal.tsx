import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { Clock, User, MapPin, Phone, Package } from 'lucide-react';

interface OrderNotification {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_code?: string;
  payment_method?: string;
  notes?: string;
}

interface OrderNotificationModalProps {
  order: OrderNotification | null;
  isOpen: boolean;
  onClose: () => void;
  type: 'new-order' | 'status-change';
}

const statusColors = {
  pending: 'bg-yellow-500',
  preparing: 'bg-blue-500',
  ready: 'bg-green-500',
  out_for_delivery: 'bg-purple-500',
  delivered: 'bg-emerald-500',
  cancelled: 'bg-red-500',
  rejected: 'bg-red-600'
};

const statusLabels = {
  pending: 'Pendente',
  preparing: 'Em Preparação',
  ready: 'Pronto',
  out_for_delivery: 'Saiu para Entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  rejected: 'Rejeitado'
};

export const OrderNotificationModal = ({ order, isOpen, onClose, type }: OrderNotificationModalProps) => {
  if (!order) return null;

  const isNewOrder = type === 'new-order';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isNewOrder ? (
              <>
                <Package className="h-5 w-5 text-green-600" />
                Novo Pedido Recebido!
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-blue-600" />
                Status do Pedido Atualizado
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isNewOrder ? 'Um novo pedido foi recebido em seu estabelecimento.' : 'O status do seu pedido foi atualizado.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Code and Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pedido</p>
              <p className="font-semibold">#{order.order_code || order.id.slice(-8)}</p>
            </div>
            <Badge 
              className={`${statusColors[order.status as keyof typeof statusColors]} text-white hover:opacity-80`}
            >
              {statusLabels[order.status as keyof typeof statusLabels] || order.status}
            </Badge>
          </div>

          {/* Customer Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{order.customer_name}</p>
              </div>
            </div>

            {order.customer_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{order.customer_phone}</p>
                </div>
              </div>
            )}

            {order.customer_address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium text-sm">{order.customer_address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total do Pedido</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(Number(order.total_amount))}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Horário</p>
                <p className="font-medium">
                  {new Date(order.created_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {order.payment_method && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                <p className="font-medium">{order.payment_method}</p>
              </div>
            )}

            {order.notes && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">Observações</p>
                <p className="text-sm bg-muted p-2 rounded">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Fechar
          </Button>
          {isNewOrder && (
            <Button 
              onClick={() => {
                window.open('/orders', '_blank');
                onClose();
              }} 
              className="flex-1"
            >
              Ver Pedidos
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};