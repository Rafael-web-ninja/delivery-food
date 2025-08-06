import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, MapPin, Phone, ShoppingBag, Calendar, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CustomerProfile {
  name: string;
  phone: string;
  address: string;
}

interface Order {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  business_id: string;
  delivery_businesses?: {
    name: string;
  } | null;
  order_items?: {
    id: string;
    menu_item_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    notes?: string;
    menu_items?: {
      name: string;
    } | null;
  }[];
}

const CustomerProfile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<CustomerProfile>({
    name: '',
    phone: '',
    address: ''
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [saving, setSaving] = useState(false);

  // Status mapping com traduções em português
  const statusMap = {
    pending: { label: 'Pendente', color: 'bg-warning text-warning-foreground' },
    confirmed: { label: 'Confirmado', color: 'bg-secondary text-secondary-foreground' },
    preparing: { label: 'Preparando', color: 'bg-blue-500 text-white' },
    ready: { label: 'Pronto', color: 'bg-success text-success-foreground' },
    delivered: { label: 'Entregue', color: 'bg-green-600 text-white' },
    cancelled: { label: 'Cancelado', color: 'bg-destructive text-destructive-foreground' }
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('customer_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao carregar perfil:', error);
          return;
        }

        if (data) {
          setProfile({
            name: data.name || '',
            phone: data.phone || '',
            address: data.address || ''
          });
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_businesses (name),
          order_items (
            *,
            menu_items (name)
          )
        `)
        .or(`customer_id.eq.${user.id},user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar pedidos:', error);
        return;
      }

      setOrders((data as any) || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('customer_profiles')
        .upsert({
          user_id: user.id,
          name: profile.name,
          phone: profile.phone,
          address: profile.address
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas informações.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleViewMenu = (businessId: string) => {
    window.open(`/menu/${businessId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
            <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Atualize seus dados para uma melhor experiência
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefone
              </Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Endereço
              </Label>
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Seu endereço completo"
              />
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </CardContent>
        </Card>

        {/* Orders History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Histórico de Pedidos
            </CardTitle>
            <CardDescription>
              Acompanhe seus pedidos realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <LoadingSpinner />
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Você ainda não fez nenhum pedido</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{order.delivery_businesses?.name}</h4>
                        <Badge 
                          className={statusMap[order.status as keyof typeof statusMap]?.color || 'bg-gray-500 text-white'}
                        >
                          {statusMap[order.status as keyof typeof statusMap]?.label || order.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDistanceToNow(new Date(order.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <p className="text-sm font-medium">Itens:</p>
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>
                            {item.quantity}x {item.menu_items?.name || 'Item'}
                            {item.notes && <span className="text-muted-foreground"> - {item.notes}</span>}
                          </span>
                          <span>R$ {item.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )) || <p className="text-sm text-muted-foreground">Nenhum item encontrado</p>}
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="font-semibold">
                        Total: R$ {order.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewMenu(order.business_id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Cardápio
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerProfile;