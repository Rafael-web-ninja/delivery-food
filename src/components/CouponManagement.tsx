import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingButton } from '@/components/ui/loading-button';
import { Plus, Edit, Trash2, Percent, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/formatters';

interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_order_value: number;
  start_at: string | null;
  end_at: string | null;
  max_uses: number | null;
  uses_count: number;
  max_uses_per_customer: number | null;
  is_active: boolean;
  created_at: string;
}

interface CouponFormData {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_order_value: number;
  start_at: string;
  end_at: string;
  max_uses: number | null;
  max_uses_per_customer: number | null;
  is_active: boolean;
}

const CouponManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState<string>('');
  
  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    type: 'percent',
    value: 0,
    min_order_value: 0,
    start_at: '',
    end_at: '',
    max_uses: null,
    max_uses_per_customer: null,
    is_active: true
  });

  useEffect(() => {
    fetchBusinessAndCoupons();
  }, [user]);

  const fetchBusinessAndCoupons = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get business ID first
      const { data: businessData, error: businessError } = await supabase
        .from('delivery_businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (businessError) throw businessError;
      
      setBusinessId(businessData.id);
      
      // Fetch coupons
      const { data: couponsData, error: couponsError } = await supabase
        .from('coupons')
        .select('*')
        .eq('business_id', businessData.id)
        .order('created_at', { ascending: false });

      if (couponsError) throw couponsError;
      
      setCoupons(couponsData || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percent',
      value: 0,
      min_order_value: 0,
      start_at: '',
      end_at: '',
      max_uses: null,
      max_uses_per_customer: null,
      is_active: true
    });
    setEditingCoupon(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      min_order_value: coupon.min_order_value,
      start_at: coupon.start_at ? new Date(coupon.start_at).toISOString().split('T')[0] : '',
      end_at: coupon.end_at ? new Date(coupon.end_at).toISOString().split('T')[0] : '',
      max_uses: coupon.max_uses,
      max_uses_per_customer: coupon.max_uses_per_customer,
      is_active: coupon.is_active
    });
    setEditingCoupon(coupon);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!businessId) return;
    
    setSaving(true);
    try {
      const couponData = {
        business_id: businessId,
        code: formData.code.toUpperCase().trim(),
        type: formData.type,
        value: formData.value,
        min_order_value: formData.min_order_value,
        start_at: formData.start_at ? new Date(formData.start_at).toISOString() : null,
        end_at: formData.end_at ? new Date(formData.end_at).toISOString() : null,
        max_uses: formData.max_uses,
        max_uses_per_customer: formData.max_uses_per_customer,
        is_active: formData.is_active
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);

        if (error) throw error;

        toast({
          title: "Cupom atualizado!",
          description: "O cupom foi atualizado com sucesso."
        });
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert(couponData);

        if (error) throw error;

        toast({
          title: "Cupom criado!",
          description: "O cupom foi criado com sucesso."
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchBusinessAndCoupons();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (couponId: string, couponCode: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cupom ${couponCode}?`)) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);

      if (error) throw error;

      toast({
        title: "Cupom excluído!",
        description: "O cupom foi excluído com sucesso."
      });
      
      fetchBusinessAndCoupons();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getCouponStatusBadge = (coupon: Coupon) => {
    if (!coupon.is_active) {
      return <Badge variant="secondary">Inativo</Badge>;
    }

    const now = new Date();
    const startDate = coupon.start_at ? new Date(coupon.start_at) : null;
    const endDate = coupon.end_at ? new Date(coupon.end_at) : null;

    if (startDate && startDate > now) {
      return <Badge variant="outline">Futuro</Badge>;
    }

    if (endDate && endDate < now) {
      return <Badge variant="destructive">Expirado</Badge>;
    }

    if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
      return <Badge variant="destructive">Esgotado</Badge>;
    }

    return <Badge variant="default">Ativo</Badge>;
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cupons de Desconto</CardTitle>
            <CardDescription>
              Gerencie cupons de desconto para seus clientes
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cupom
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum cupom criado ainda.</p>
            <p className="text-sm">Crie seu primeiro cupom para oferecer descontos aos clientes!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-lg">{coupon.code}</span>
                    {getCouponStatusBadge(coupon)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(coupon)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(coupon.id, coupon.code)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Desconto:</span>
                    <div className="flex items-center gap-1">
                      {coupon.type === 'percent' ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                      {coupon.type === 'percent' ? `${coupon.value}%` : formatCurrency(coupon.value)}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Pedido mín:</span>
                    <div>{formatCurrency(coupon.min_order_value)}</div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Usos:</span>
                    <div>{coupon.uses_count}{coupon.max_uses ? `/${coupon.max_uses}` : ''}</div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Validade:</span>
                    <div className="text-xs">
                      {coupon.end_at ? new Date(coupon.end_at).toLocaleDateString('pt-BR') : 'Sem limite'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
            </DialogTitle>
            <DialogDescription>
              {editingCoupon ? 'Edite as informações do cupom' : 'Crie um novo cupom de desconto'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código do Cupom</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="DESCONTO10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Desconto</Label>
                <Select value={formData.type} onValueChange={(value: 'percent' | 'fixed') => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">
                  {formData.type === 'percent' ? 'Percentual' : 'Valor'} do Desconto
                </Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  max={formData.type === 'percent' ? "100" : undefined}
                  step={formData.type === 'percent' ? "1" : "0.01"}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  placeholder={formData.type === 'percent' ? "10" : "5.00"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_order_value">Pedido Mínimo (R$)</Label>
                <Input
                  id="min_order_value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.min_order_value}
                  onChange={(e) => setFormData({ ...formData, min_order_value: Number(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_at">Data de Início (opcional)</Label>
                <Input
                  id="start_at"
                  type="date"
                  value={formData.start_at}
                  onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_at">Data de Fim (opcional)</Label>
                <Input
                  id="end_at"
                  type="date"
                  value={formData.end_at}
                  onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_uses">Limite Total de Usos (opcional)</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="1"
                  value={formData.max_uses || ''}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Ex: 100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_uses_per_customer">Limite por Cliente (opcional)</Label>
                <Input
                  id="max_uses_per_customer"
                  type="number"
                  min="1"
                  value={formData.max_uses_per_customer || ''}
                  onChange={(e) => setFormData({ ...formData, max_uses_per_customer: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Ex: 1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Cupom Ativo</Label>
                <p className="text-sm text-muted-foreground">
                  Desative para pausar temporariamente o cupom
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <LoadingButton onClick={handleSave} loading={saving}>
              {editingCoupon ? 'Atualizar' : 'Criar'} Cupom
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CouponManagement;