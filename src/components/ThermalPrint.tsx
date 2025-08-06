import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';

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
    try {
      // Criar novo PDF
      const pdf = new jsPDF({
        unit: 'mm',
        format: [80, 200], // Formato de impressora térmica (80mm de largura)
        orientation: 'portrait'
      });

      // Configurar fonte
      pdf.setFont('helvetica', 'normal');
      
      let yPosition = 10;
      const lineHeight = 4;
      const leftMargin = 5;
      
      // Cabeçalho
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(businessName.toUpperCase(), leftMargin, yPosition);
      yPosition += lineHeight * 1.5;
      
      // Linha separadora
      pdf.text('================================', leftMargin, yPosition);
      yPosition += lineHeight;
      
      // Informações do pedido
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`PEDIDO #${order.id.slice(-8)}`, leftMargin, yPosition);
      yPosition += lineHeight;
      
      pdf.text(`Data: ${new Date(order.created_at).toLocaleString('pt-BR')}`, leftMargin, yPosition);
      yPosition += lineHeight * 1.5;
      
      // Dados do cliente
      pdf.setFont('helvetica', 'bold');
      pdf.text('CLIENTE:', leftMargin, yPosition);
      yPosition += lineHeight;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(order.customer_name, leftMargin, yPosition);
      yPosition += lineHeight;
      
      pdf.text(`Tel: ${order.customer_phone}`, leftMargin, yPosition);
      yPosition += lineHeight;
      
      if (order.customer_address) {
        // Quebrar endereço em múltiplas linhas se necessário
        const addressLines = pdf.splitTextToSize(order.customer_address, 70);
        addressLines.forEach((line: string) => {
          pdf.text(line, leftMargin, yPosition);
          yPosition += lineHeight;
        });
      }
      
      yPosition += lineHeight;
      pdf.text('--------------------------------', leftMargin, yPosition);
      yPosition += lineHeight;
      
      // Itens do pedido
      pdf.setFont('helvetica', 'bold');
      pdf.text('ITENS:', leftMargin, yPosition);
      yPosition += lineHeight;
      
      pdf.setFont('helvetica', 'normal');
      order.order_items.forEach(item => {
        const itemText = `${item.quantity}x ${item.menu_items.name}`;
        const priceText = `R$ ${(item.quantity * Number(item.unit_price)).toFixed(2)}`;
        
        // Item name (pode quebrar linha se muito longo)
        const itemLines = pdf.splitTextToSize(itemText, 50);
        itemLines.forEach((line: string, index: number) => {
          pdf.text(line, leftMargin, yPosition);
          if (index === itemLines.length - 1) {
            // Preço alinhado à direita na última linha do item
            pdf.text(priceText, 75 - pdf.getTextWidth(priceText), yPosition);
          }
          yPosition += lineHeight;
        });
      });
      
      // Total
      yPosition += lineHeight;
      pdf.text('--------------------------------', leftMargin, yPosition);
      yPosition += lineHeight;
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      const totalText = `TOTAL: R$ ${Number(order.total_amount).toFixed(2)}`;
      pdf.text(totalText, leftMargin, yPosition);
      yPosition += lineHeight;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const paymentText = `PAGAMENTO: ${order.payment_method.toUpperCase()}`;
      pdf.text(paymentText, leftMargin, yPosition);
      yPosition += lineHeight * 1.5;
      
      // Observações
      if (order.notes) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('OBSERVAÇÕES:', leftMargin, yPosition);
        yPosition += lineHeight;
        
        pdf.setFont('helvetica', 'normal');
        const notesLines = pdf.splitTextToSize(order.notes, 70);
        notesLines.forEach((line: string) => {
          pdf.text(line, leftMargin, yPosition);
          yPosition += lineHeight;
        });
        yPosition += lineHeight;
      }
      
      // Status e horário
      pdf.text('--------------------------------', leftMargin, yPosition);
      yPosition += lineHeight;
      
      pdf.text(`Status: ${order.status.toUpperCase()}`, leftMargin, yPosition);
      yPosition += lineHeight;
      
      const timeText = formatDistanceToNow(new Date(order.created_at), { 
        addSuffix: true, 
        locale: ptBR 
      });
      pdf.text(`Horário: ${timeText}`, leftMargin, yPosition);
      yPosition += lineHeight * 1.5;
      
      // Rodapé
      pdf.text('================================', leftMargin, yPosition);
      
      // Abrir PDF em nova aba
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      // Limpar URL após um tempo
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 10000);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      
      // Fallback: usar método anterior se PDF falhar
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
      }
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
      Imprimir PDF
    </Button>
  );
}