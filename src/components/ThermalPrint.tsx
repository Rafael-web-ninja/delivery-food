import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { formatCurrency, paymentTranslations } from '@/lib/formatters';

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
    const writeLabelValueFixed = (label: string, value: string) => {
      const LABEL_W = 22; // fixed columns for label
      const VALUE_W = COLS - LABEL_W; // 10
      const l = sanitize(label).slice(0, LABEL_W);
      const v = sanitize(value).slice(0, VALUE_W);
      const line = l.padEnd(LABEL_W, ' ') + v.padStart(VALUE_W, ' ');
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
    // Center order code and date before separator
    // Keep center alignment from header
    const orderCode = order.order_code || order.id.slice(-8);
    writeLine(`PEDIDO #${orderCode}`);
    const d = new Date(order.created_at);
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    writeLine(`Data: ${dateStr}`);
    hrEq();
    alignLeft();
    writeLine('');

    // Customer
    boldOn();
    writeLine('CLIENTE');
    boldOff();
    writeLinesWrapped(order.customer_name);
    writeLine(`Tel: ${order.customer_phone}`);
    const complement = (order as any).customer_complement as string | undefined;
    const neighborhood = (order as any).customer_neighborhood as string | undefined;
    const addrParts: string[] = [];
    if (order.customer_address) addrParts.push(order.customer_address);
    if (complement) addrParts.push(`Compl. ${complement}`);
    if (neighborhood) addrParts.push(`Bairro ${neighborhood}`);
    if (addrParts.length) writeLinesWrapped(addrParts.join(' - '));
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

      // Extrair detalhes do notes se for meio a meio
      const itemNotes = (item as any).notes as string | null | undefined;
      let detailsParts: string[] = [];
      
      // Se tem notes, assumir que é meio a meio e extrair informações
      if (itemNotes && itemNotes.includes('Meio a meio')) {
        detailsParts.push(itemNotes);
      } else {
        // Fallback para detalhes antigos se não tiver notes
        const size = (item as any).size as string | undefined;
        const f1 = (((item as any).flavor1 && (item as any).flavor1.name) ? (item as any).flavor1.name : (item as any).flavor1) as string | undefined;
        const f2 = (((item as any).flavor2 && (item as any).flavor2.name) ? (item as any).flavor2.name : (item as any).flavor2) as string | undefined;
        const flavor = f1 && f2 ? `1/2 ${f1} + 1/2 ${f2}` : (f1 || f2);
        let addons: string[] | string | undefined = (item as any).addons as any;
        const addonsStr = Array.isArray(addons) ? addons.join(', ') : addons;
        
        if (flavor) detailsParts.push(`Sabor: ${flavor}`);
        if (size) detailsParts.push(`Tamanho: ${size}`);
        if (addonsStr) detailsParts.push(`Adicionais: ${addonsStr}`);
        if (!detailsParts.length && itemNotes) detailsParts.push(itemNotes);
      }

      if (detailsParts.length) {
        const detailsLine = `  ${detailsParts.join(' / ')}`;
        for (const l of toLines(detailsLine)) writeLine(l);
      }
    }

    hr();

    // Totals and payment
    const subtotalNumber = order.order_items.reduce((sum, it) => sum + it.quantity * Number(it.unit_price), 0);
    const deliveryFee = Number((order as any).delivery_fee || 0);
    const discount = Number((order as any).discount || 0);

    writeLabelValueFixed('SUBTOTAL:', sanitize(formatCurrency(subtotalNumber)));
    if (deliveryFee > 0) writeLabelValueFixed('ENTREGA:', sanitize(formatCurrency(deliveryFee)));
    if (discount > 0) writeLabelValueFixed('DESCONTOS:', `-${sanitize(formatCurrency(discount))}`);

    boldOn();
    const total = sanitize(formatCurrency(Number(order.total_amount)));
    writeLabelValueFixed('TOTAL:', total);
    boldOff();

    const paymentLabel = paymentTranslations[order.payment_method as keyof typeof paymentTranslations] || order.payment_method;
    const paymentDetails = (order as any).payment_details || (order as any).card_brand || '';
    const paymentOut = paymentDetails ? `${paymentLabel} - ${paymentDetails}` : paymentLabel;
    writeLine(`PAGAMENTO: ${sanitize(paymentOut)}`);

    if (order.payment_method === 'cash') {
      const changeFor = Number((order as any).change_for || (order as any).cash_change || (order as any).change_amount || 0);
      if (changeFor > 0) writeLine(`Troco para: ${sanitize(formatCurrency(changeFor))}`);
    }

    hr();

    // Observations
    if (order.notes) {
      writeLine('OBSERVACOES:');
      writeLinesWrapped(order.notes);
    }

    // Final message
    alignCenter();
    writeLine('Obrigado pela preferencia!');
    alignLeft();

    // Extra feeds (3 lines)
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