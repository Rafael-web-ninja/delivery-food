import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';

interface FlavorOption {
  id: string;
  name: string;
  active: boolean;
}

interface FlavorPrice { flavor_id: string; size: 'broto' | 'grande'; price: number }

interface FractionalPizzaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  baseItem: { id: string; name: string } | null;
  menuItemId?: string;
  quantity: number;
  onConfirm: (item: { id: string; menu_item_id: string; name: string; price: number; quantity: number; details?: any }) => void;
}

export default function FractionalPizzaDialog({ open, onOpenChange, businessId, baseItem, menuItemId, quantity, onConfirm }: FractionalPizzaDialogProps) {
  const [loading, setLoading] = useState(false);
  const [flavors, setFlavors] = useState<FlavorOption[]>([]);
  const [prices, setPrices] = useState<Record<string, { broto?: number; grande?: number }>>({});

  const [size, setSize] = useState<'broto' | 'grande'>('broto');
  const [flavor1, setFlavor1] = useState<string>('');
  const [flavor2, setFlavor2] = useState<string>('');

  useEffect(() => {
    if (!open || !businessId) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data: opts } = await supabase
          .from('flavor_options')
          .select('id,name,active')
          .eq('business_id', businessId)
          .eq('active', true)
          .order('name');

        let available = (opts || []) as any[];

        // Se o item tiver restrição de sabores, aplica o filtro
        if (menuItemId) {
          const { data: allowedRows } = await supabase
            .from('menu_item_flavors')
            .select('flavor_id')
            .eq('menu_item_id', menuItemId);

          const allowedIds = (allowedRows || []).map(r => r.flavor_id);
          if (allowedIds.length > 0) {
            available = available.filter(o => allowedIds.includes(o.id));
          }
        }

        setFlavors(available as any);

        const ids = available.map((o: any) => o.id);
        if (ids.length > 0) {
          const { data: p } = await supabase
            .from('flavor_prices')
            .select('flavor_id,size,price')
            .in('flavor_id', ids);
          const map: Record<string, { broto?: number; grande?: number }> = {};
          (p || []).forEach(fp => {
            if (!map[fp.flavor_id]) map[fp.flavor_id] = {};
            map[fp.flavor_id][fp.size as 'broto' | 'grande'] = Number(fp.price);
          });
          setPrices(map);
        } else {
          setPrices({});
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, businessId, menuItemId]);

  useEffect(() => {
    if (!open) {
      // reset on close
      setSize('broto');
      setFlavor1('');
      setFlavor2('');
    }
  }, [open]);

  const computedPrice = useMemo(() => {
    if (!flavor1 || !flavor2) return 0;
    const p1 = prices[flavor1]?.[size] ?? 0;
    const p2 = prices[flavor2]?.[size] ?? 0;
    return Math.max(Number(p1), Number(p2));
  }, [flavor1, flavor2, size, prices]);

  const canConfirm = baseItem && flavor1 && flavor2 && computedPrice > 0 && quantity > 0;

  const onConfirmClick = () => {
    if (!baseItem) return;
    const f1 = flavors.find(f => f.id === flavor1);
    const f2 = flavors.find(f => f.id === flavor2);
    const sizeLabel = size === 'broto' ? 'Broto' : 'Grande';
    const displayName = `${baseItem.name} - ${sizeLabel} (1/2 ${f1?.name} + 1/2 ${f2?.name})`;
    const cartKey = `${baseItem.id}|half|${size}|${flavor1}|${flavor2}`;
    onConfirm({
      id: cartKey,
      menu_item_id: baseItem.id,
      name: displayName,
      price: computedPrice,
      quantity,
      details: { size, flavor1: { id: flavor1, name: f1?.name }, flavor2: { id: flavor2, name: f2?.name } }
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Monte sua pizza meio a meio</DialogTitle>
          <DialogDescription>Selecione o tamanho e 2 sabores. O preço segue a regra do iFood (maior valor).</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!loading && flavors.length === 0 && (
            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              Nenhum sabor disponível no momento.
            </div>
          )}
          <div className="space-y-2">
            <Label>Tamanho</Label>
            <RadioGroup value={size} onValueChange={(v) => setSize(v as any)} className="grid grid-cols-2 gap-2">
              <label htmlFor="size-broto" className="flex items-center gap-2 p-3 border rounded-md cursor-pointer">
                <RadioGroupItem id="size-broto" value="broto" />
                <span>Broto</span>
              </label>
              <label htmlFor="size-grande" className="flex items-center gap-2 p-3 border rounded-md cursor-pointer">
                <RadioGroupItem id="size-grande" value="grande" />
                <span>Grande</span>
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Sabor 1</Label>
            <Select value={flavor1} onValueChange={setFlavor1}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? 'Carregando...' : 'Selecione o sabor'} />
              </SelectTrigger>
              <SelectContent>
                {flavors.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} {prices[f.id]?.[size] != null ? `— ${formatCurrency(Number(prices[f.id]?.[size]))}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sabor 2</Label>
            <Select value={flavor2} onValueChange={setFlavor2}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? 'Carregando...' : 'Selecione o sabor'} />
              </SelectTrigger>
              <SelectContent>
                {flavors.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} {prices[f.id]?.[size] != null ? `— ${formatCurrency(Number(prices[f.id]?.[size]))}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-muted-foreground">Preço</div>
            <div className="text-lg font-semibold">{formatCurrency(computedPrice)}</div>
          </div>

          <Button disabled={!canConfirm} onClick={onConfirmClick} className="w-full">
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
