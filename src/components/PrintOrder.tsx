import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  total_amount: number;
  delivery_fee?: number;
  payment_method: string;
  notes?: string;
  created_at: string;
  order_items?: {
    quantity: number;
    unit_price: number;
    total_price: number;
    notes?: string;
    menu_items?: {
      name: string;
    } | null;
  }[];
}

interface PrintOrderProps {
  order: Order;
  businessName?: string;
}

export const PrintOrder = ({ order, businessName = "Delivery" }: PrintOrderProps) => {
  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Pedido #${order.id.slice(-6)}</title>
          <style>
            @media print {
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                line-height: 1.2;
                margin: 0;
                padding: 10px;
                max-width: 80mm;
              }
              .header { 
                text-align: center; 
                border-bottom: 1px dashed #000; 
                padding-bottom: 5px; 
                margin-bottom: 10px;
              }
              .section { 
                margin-bottom: 10px; 
                border-bottom: 1px dashed #000; 
                padding-bottom: 5px;
              }
              .item { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 2px;
              }
              .total { 
                font-weight: bold; 
                font-size: 14px;
                text-align: center;
                margin-top: 10px;
              }
              .cut-line {
                text-align: center;
                margin: 10px 0;
                font-size: 10px;
              }
              @page { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${businessName}</h2>
            <p>PEDIDO #${order.id.slice(-6)}</p>
            <p>${new Date(order.created_at).toLocaleString('pt-BR')}</p>
          </div>
          
          <div class="section">
            <h3>CLIENTE:</h3>
            <p><strong>${order.customer_name}</strong></p>
            <p>Tel: ${order.customer_phone}</p>
            ${order.customer_address ? `<p>End: ${order.customer_address}</p>` : ''}
          </div>
          
          <div class="section">
            <h3>ITENS:</h3>
            ${order.order_items?.map(item => `
              <div class="item">
                <span>${item.quantity}x ${item.menu_items?.name || 'Item'}</span>
                <span>R$ ${item.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              ${item.notes ? `<div style="font-size: 10px; margin-left: 10px;">Obs: ${item.notes}</div>` : ''}
            `).join('') || '<p>Nenhum item</p>'}
          </div>
          
          <div class="section">
            <h3>PAGAMENTO:</h3>
            <p>Método: ${getPaymentMethodName(order.payment_method)}</p>
            ${order.delivery_fee ? `<p>Taxa de entrega: R$ ${order.delivery_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>` : ''}
          </div>
          
          ${order.notes ? `
          <div class="section">
            <h3>OBSERVAÇÕES:</h3>
            <p>${order.notes}</p>
          </div>` : ''}
          
          <div class="total">
            TOTAL: R$ ${order.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          
          <div class="cut-line">
            - - - - - - - - - - - - - - - - -
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  const getPaymentMethodName = (method: string) => {
    const methodMap: { [key: string]: string } = {
      'cash': 'Dinheiro',
      'card': 'Cartão',
      'debit': 'Cartão de Débito',
      'credit': 'Cartão de Crédito',
      'pix': 'PIX',
      'bank_transfer': 'Transferência Bancária'
    };
    return methodMap[method] || method;
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      className="gap-2"
    >
      <Printer className="w-4 h-4" />
      Imprimir
    </Button>
  );
};