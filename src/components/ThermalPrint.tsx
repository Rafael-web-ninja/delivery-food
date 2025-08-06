import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
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

interface ThermalPrintProps {
  order: Order;
  businessName: string;
}

export function ThermalPrint({ order, businessName }: ThermalPrintProps) {
  const handlePrint = () => {
    const printContent = `
========================================
           ${businessName.toUpperCase()}
========================================

PEDIDO #${order.id.slice(-8)}
Data: ${new Date(order.created_at).toLocaleString('pt-BR')}

----------------------------------------
CLIENTE:
${order.customer_name}
Tel: ${order.customer_phone}
${order.customer_address ? `End: ${order.customer_address}` : ''}

----------------------------------------
ITENS:
${order.order_items.map(item => 
  `${item.quantity}x ${item.menu_items.name.padEnd(20)} R$ ${(item.quantity * Number(item.unit_price)).toFixed(2)}`
).join('\n')}

----------------------------------------
TOTAL: R$ ${Number(order.total_amount).toFixed(2)}
PAGAMENTO: ${order.payment_method.toUpperCase()}

${order.notes ? `\nOBSERVAÇÕES:\n${order.notes}` : ''}

----------------------------------------
Status: ${order.status.toUpperCase()}
Horário: ${formatDistanceToNow(new Date(order.created_at), { 
  addSuffix: true, 
  locale: ptBR 
})}

========================================
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Pedido #${order.id.slice(-8)}</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.2;
                margin: 0;
                padding: 10px;
                white-space: pre-wrap;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <Button 
      onClick={handlePrint}
      variant="outline" 
      size="sm"
      className="flex items-center gap-2"
    >
      <Printer className="h-4 w-4" />
      Imprimir
    </Button>
  );
}