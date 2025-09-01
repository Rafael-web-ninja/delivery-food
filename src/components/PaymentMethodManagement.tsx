import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { paymentTranslations } from '@/lib/formatters';

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  instructions?: string;
}

const PAYMENT_ICONS = {
  cash: Banknote,
  pix: Smartphone,
  credit_card: CreditCard,
  debit_card: CreditCard,
  vr: CreditCard,
  food_voucher: CreditCard,
  card: CreditCard, // legado
} as const;

export default function PaymentMethodManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<{ type: 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'vr' | 'food_voucher'; instructions: string }>({
    type: 'cash',
    instructions: ''
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

const fetchPaymentMethods = async () => {
  try {
    // Buscar o negócio do dono para filtrar corretamente
    const { data: businessData, error: businessError } = await supabase
      .from('delivery_businesses')
      .select('id')
      .eq('owner_id', user?.id)
      .single();

    if (businessError) throw businessError;
    if (!businessData) return;

    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('business_id', businessData.id)
      .order('name');

    if (error) throw error;
    if (data) setPaymentMethods(data);
  } catch (error) {
    console.error('Erro ao buscar métodos de pagamento:', error);
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      // Buscar o business_id do usuário
      const { data: businessData, error: businessError } = await supabase
        .from('delivery_businesses')
        .select('id')
        .eq('owner_id', user?.id)
        .single();

      if (businessError) throw businessError;
      if (!businessData) throw new Error('Negócio não encontrado');

      const methodData = {
        name: paymentTranslations[formData.type as keyof typeof paymentTranslations],
        type: formData.type,
        instructions: formData.instructions,
        business_id: businessData.id,
        is_active: true
      };

      const { error } = await supabase
        .from('payment_methods')
        .insert([methodData]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Método de pagamento criado"
      });

      setDialogOpen(false);
      setFormData({ type: 'cash', instructions: '' });
      fetchPaymentMethods();

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

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este método de pagamento?')) return;

    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Método de pagamento excluído"
      });
      fetchPaymentMethods();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (method: PaymentMethod) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: !method.is_active })
        .eq('id', method.id);

      if (error) throw error;
      fetchPaymentMethods();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Métodos de Pagamento</CardTitle>
            <CardDescription>
              Configure os métodos de pagamento aceitos em seu delivery
            </CardDescription>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Método
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Método de Pagamento</DialogTitle>
                <DialogDescription>
                  Configure um novo método de pagamento aceito
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">

                <div className="space-y-2">
                  <Label htmlFor="type">Método de pagamento</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:border-primary focus:outline-none"
                  >
<option value="cash">Dinheiro</option>
<option value="pix">PIX</option>
<option value="credit_card">Cartão de Crédito</option>
<option value="debit_card">Cartão de Débito</option>
<option value="vr">Vale Refeição</option>
<option value="food_voucher">Vale Alimentação</option>
                  </select>
                </div>


                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Salvando...' : 'Criar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {paymentMethods.map((method) => {
            const IconComponent = (PAYMENT_ICONS as any)[method.type] || CreditCard;
            return (
              <Card key={method.id} className={!method.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-6 w-6 text-primary" />
                      <div>
                        <h3 className="font-semibold">{method.name}</h3>
                        {method.instructions && (
                          <p className="text-sm text-muted-foreground">
                            {method.instructions}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Switch
                        checked={method.is_active}
                        onCheckedChange={() => toggleActive(method)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(method.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {paymentMethods.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum método de pagamento configurado</p>
              <p className="text-sm">Configure métodos para que os clientes possam escolher como pagar</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}