import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface FlavorOption {
  id: string;
  business_id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  active: boolean;
}

interface FlavorPrice {
  id: string;
  flavor_id: string;
  size: 'broto' | 'grande';
  price: number;
}

export default function FlavorManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [businessId, setBusinessId] = useState<string>('');
  const [flavors, setFlavors] = useState<FlavorOption[]>([]);
  const [prices, setPrices] = useState<Record<string, { broto?: number; grande?: number }>>({});
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FlavorOption | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    active: true,
    price_broto: '',
    price_grande: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadBiz = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('delivery_businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single();
      if (data?.id) {
        setBusinessId(data.id);
      }
    };
    loadBiz();
  }, [user?.id]);

  useEffect(() => {
    if (!businessId) return;
    void fetchFlavors();
  }, [businessId]);

  const fetchFlavors = async () => {
    const { data: opts } = await supabase
      .from('flavor_options')
      .select('*')
      .eq('business_id', businessId)
      .order('name');
    setFlavors((opts || []) as any);

    if (opts && opts.length > 0) {
      const ids = opts.map(o => o.id);
      const { data: p } = await supabase
        .from('flavor_prices')
        .select('*')
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
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', description: '', active: true, price_broto: '', price_grande: '' });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    try {
      let flavorId = editing?.id || '';
      if (!editing) {
        const { data, error } = await supabase
          .from('flavor_options')
          .insert({
            name: form.name,
            description: form.description || null,
            active: form.active,
            business_id: businessId,
          })
          .select('id')
          .single();
        if (error) throw error;
        flavorId = data!.id;
      } else {
        const { error } = await supabase
          .from('flavor_options')
          .update({
            name: form.name,
            description: form.description || null,
            active: form.active,
          })
          .eq('id', editing.id);
        if (error) throw error;
        flavorId = editing.id;
      }

      // Upsert prices for both sizes
      const upserts: Array<Partial<FlavorPrice>> = [];
      if (form.price_broto) {
        upserts.push({ flavor_id: flavorId, size: 'broto', price: Number(form.price_broto) });
      }
      if (form.price_grande) {
        upserts.push({ flavor_id: flavorId, size: 'grande', price: Number(form.price_grande) });
      }

      for (const u of upserts) {
        // Try update then insert if not exists
        const { data: existing } = await supabase
          .from('flavor_prices')
          .select('id')
          .eq('flavor_id', flavorId)
          .eq('size', u.size)
          .maybeSingle();
        if (existing?.id) {
          await supabase
            .from('flavor_prices')
            .update({ price: u.price })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('flavor_prices')
            .insert({ flavor_id: flavorId, size: u.size as any, price: u.price! });
        }
      }

      toast({ title: 'Sucesso', description: editing ? 'Sabor atualizado' : 'Sabor criado' });
      setOpen(false);
      resetForm();
      await fetchFlavors();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (flavor: FlavorOption) => {
    setEditing(flavor);
    const p = prices[flavor.id] || {};
    setForm({
      name: flavor.name,
      description: flavor.description || '',
      active: flavor.active,
      price_broto: p.broto ? String(p.broto) : '',
      price_grande: p.grande ? String(p.grande) : ''
    });
    setOpen(true);
  };

  const onDelete = async (id: string) => {
    if (!confirm('Excluir este sabor?')) return;
    const { error } = await supabase.from('flavor_options').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir', variant: 'destructive' });
    } else {
      toast({ title: 'Excluído', description: 'Sabor removido' });
      await fetchFlavors();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Sabores</h2>
          <p className="text-sm text-muted-foreground">Gerencie sabores para montar pizzas meio a meio</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Sabor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Sabor' : 'Novo Sabor'}</DialogTitle>
              <DialogDescription>Informe nome, disponibilidade e preços por tamanho</DialogDescription>
            </DialogHeader>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="active">Ativo</Label>
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço Broto</Label>
                  <Input type="number" step="0.01" value={form.price_broto} onChange={(e) => setForm({ ...form, price_broto: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Preço Grande</Label>
                  <Input type="number" step="0.01" value={form.price_grande} onChange={(e) => setForm({ ...form, price_grande: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Salvando...' : 'Salvar'}</Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flavors.map(f => (
          <Card key={f.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{f.name}</CardTitle>
                  <CardDescription>{f.description}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(f)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(f.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <div>Broto: <span className="font-medium text-foreground">{prices[f.id]?.broto != null ? formatCurrency(Number(prices[f.id]?.broto)) : '-'}</span></div>
                <div>Grande: <span className="font-medium text-foreground">{prices[f.id]?.grande != null ? formatCurrency(Number(prices[f.id]?.grande)) : '-'}</span></div>
              </div>
            </CardContent>
          </Card>
        ))}
        {flavors.length === 0 && (
          <div className="col-span-full text-sm text-muted-foreground">Nenhum sabor cadastrado ainda</div>
        )}
      </div>
    </div>
  );
}
