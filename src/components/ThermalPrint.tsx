import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { formatCurrency, paymentTranslations, statusTranslations } from '@/lib/formatters';

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

interface ThermalPrintProps {
  order: Order;
  businessName: string;
}

export function ThermalPrint({ order, businessName }: ThermalPrintProps) {
  const handlePrint = () => {
    const COLS = 32;
    const LF = 0x0A;

    // Helpers
    const stripAccents = (s: string) =>
      s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ç/g, 'c')
        .replace(/Ç/g, 'C');

    const sanitize = (s: string) => stripAccents(s).replace(/[^\x20-\x7E]/g, '');

    const toLines = (s: string) => {
      const text = sanitize(s);
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let line = '';
      for (const w of words) {
        if ((line.length ? line.length + 1 : 0) + w.length <= COLS) {
          line = line.length ? line + ' ' + w : w;
        } else {
          if (line) lines.push(line);
          if (w.length > COLS) {
            for (let i = 0; i < w.length; i += COLS) {
              lines.push(w.slice(i, i + COLS));
            }
            line = '';
          } else {
            line = w;
          }
        }
      }
      if (line) lines.push(line);
      return lines;
    };

    const bytes: number[] = [];
    const push = (...arr: number[]) => bytes.push(...arr);
    const writeLine = (s: string) => {
      const t = sanitize(s).slice(0, COLS);
      for (let i = 0; i < t.length; i++) push(t.charCodeAt(i));
      push(LF);
    };
    const writeLinesWrapped = (s: string) => toLines(s).forEach(writeLine);
    const writeLabelValue = (label: string, value: string) => {
      const val = sanitize(value).slice(0, COLS);
      const leftMax = Math.max(0, COLS - val.length - 1);
      const leftText = sanitize(label).slice(0, leftMax);
      const line = leftText.padEnd(leftMax, ' ') + ' ' + val;
      writeLine(line);
    };

    // ESC/POS helpers
    const alignCenter = () => push(0x1B, 0x61, 0x01);
    const alignLeft = () => push(0x1B, 0x61, 0x00);
    const boldOn = () => push(0x1B, 0x45, 0x01);
    const boldOff = () => push(0x1B, 0x45, 0x00);
    const doubleOn = () => push(0x1D, 0x21, 0x11);
    const doubleOff = () => push(0x1D, 0x21, 0x00);
    const hr = () => writeLine('-'.repeat(COLS));
    const hrEq = () => writeLine('='.repeat(COLS));

    // Initialize and set code page CP-850 (ESC @, ESC t 2)
    push(0x1B, 0x40);
    push(0x1B, 0x74, 0x02);

    // Header
    alignCenter();
    boldOn();
    doubleOn();
    writeLine(businessName.toUpperCase());
    doubleOff();
    boldOff();
    hrEq();
    alignLeft();

    // Order info
    const orderCode = order.order_code || order.id.slice(-8);
    writeLine(`PEDIDO #${orderCode}`);
    const d = new Date(order.created_at);
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    writeLine(`Data: ${dateStr}`);
    hrEq();
    writeLine('');

    // Customer
    boldOn();
    writeLine('CLIENTE:');
    boldOff();
    writeLinesWrapped(order.customer_name);
    writeLine(`Tel: ${order.customer_phone}`);
    if (order.customer_address) {
      writeLine('End:');
      writeLinesWrapped(order.customer_address);
    }
    const complement = (order as any).customer_complement as string | undefined;
    const neighborhood = (order as any).customer_neighborhood as string | undefined;
    if (complement) writeLinesWrapped(`Compl.: ${complement}`);
    if (neighborhood) writeLinesWrapped(`Bairro: ${neighborhood}`);
    hr();

    // Items
    boldOn();
    writeLine('ITENS:');
    boldOff();

    for (const item of order.order_items) {
      const name = (item.menu_items?.name || '').toString();
      const qty = item.quantity;
      const priceNumber = qty * Number(item.unit_price);
      const price = sanitize(formatCurrency(priceNumber));

      const left = `${qty}x ${name}`;
      const priceLen = price.length;
      const leftMax = Math.max(0, COLS - priceLen - 1);
      const leftTrim = sanitize(left).slice(0, leftMax);
      const line = leftTrim.padEnd(leftMax, ' ') + ' ' + price;
      writeLine(line);

      const itemNotes = (item as any).notes as string | null | undefined;
      if (itemNotes) {
        for (const l of toLines(`  > ${itemNotes}`)) writeLine(l);
      }
    }

    hr();

    // Totals and payment
    const subtotalNumber = order.order_items.reduce((sum, it) => sum + it.quantity * Number(it.unit_price), 0);
    const deliveryFee = Number((order as any).delivery_fee || 0);
    const discount = Number((order as any).discount || 0);

    writeLabelValue('SUBTOTAL:', sanitize(formatCurrency(subtotalNumber)));
    if (deliveryFee > 0) writeLabelValue('ENTREGA:', sanitize(formatCurrency(deliveryFee)));
    if (discount > 0) writeLabelValue('DESCONTO:', `-${sanitize(formatCurrency(discount))}`);

    boldOn();
    const total = sanitize(formatCurrency(Number(order.total_amount)));
    writeLabelValue('TOTAL:', total);
    boldOff();

    const paymentLabel = paymentTranslations[order.payment_method as keyof typeof paymentTranslations] || order.payment_method;
    const paymentDetails = (order as any).payment_details || (order as any).card_brand || '';
    const paymentOut = paymentDetails ? `${paymentLabel} - ${paymentDetails}` : paymentLabel;
    writeLine(`PAGAMENTO: ${sanitize(paymentOut)}`);

    hr();

    // Status
    const statusLabel = (statusTranslations as any)[order.status] || order.status;
    writeLine(`Status: ${sanitize(statusLabel)}`);

    // Observations
    if (order.notes) {
      writeLine('');
      boldOn();
      writeLine('OBS:');
      boldOff();
      writeLinesWrapped(order.notes);
    }

    // Final message
    writeLine('');
    alignCenter();
    writeLine('Obrigado pela preferencia!');
    alignLeft();

    // Extra feeds
    writeLine('');
    writeLine('');
    writeLine('');

    // Cut (GS V B 0)
    push(0x1D, 0x56, 0x42, 0x00);

    // Download file immediately
    const blob = new Blob([new Uint8Array(bytes)], { type: 'text/plain; charset=binary' });
    const filename = `pedido-${order.id}-termico.txt`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  return (
    <Button 
      onClick={handlePrint}
      variant="outline" 
      size="sm"
      className="flex items-center gap-2"
    >
      <Printer className="h-4 w-4" />
      Imprimir Pedido
    </Button>
  );
}