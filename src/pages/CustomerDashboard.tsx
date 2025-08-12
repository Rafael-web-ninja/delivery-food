import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Phone, MapPin, Clock, Package, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, statusTranslations as statusLabels } from '@/lib/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  address: string;
}

interface CustomerOrder {
  id: string;
  order_code?: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  status: string;
  total_amount: number;
  created_at: string;
  delivery_id: string;
  delivery_businesses: {
    id: string;
    name: string;
  };
  order_items: Array<{
    quantity: number;
    unit_price: number;
    menu_items: {
      name: string;
    };
  }>;
}

const statusTranslations = {
  pending: 'Pendente',
  preparing: 'Em Preparação',
  ready: 'Pronto para Entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
};

const statusColors = {
  pending: 'destructive',
  preparing: 'default',
  ready: 'secondary',
  delivered: 'default',
  cancelled: 'outline'
} as const;

const CustomerDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<CustomerProfile>({
    id: '',
    name: '',
    phone: '',
    address: ''
  });
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchOrders();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
      }
      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', error);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      // 1. Buscar customer_id do customer_profiles usando auth.uid()
      const { data: customerProfile, error: customerError } = await supabase
        .from('customer_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (customerError) {
        throw customerError;
      }

      if (!customerProfile) {
        console.log('Perfil de cliente não encontrado');
        setOrders([]);
        return;
      }

      // 2. Buscar pedidos do cliente, igual à aba de catálogo > pedidos
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_businesses!orders_delivery_id_fkey(id, name),
          order_items (
            quantity,
            unit_price,
            menu_items (name)
          )
        `)
        .eq('customer_id', customerProfile.id)
        .order('created_at', { ascending: false });

      if (data) setOrders(data as any);
      if (error) console.error('Erro ao buscar pedidos:', error);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    }
  };

  const saveProfile = async () => {
    if (!profile.name || !profile.phone) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e telefone são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const profileData = {
        user_id: user?.id,
        name: profile.name,
        phone: profile.phone,
        address: profile.address
      };

      const { error } = await supabase
        .from('customer_profiles')
        .upsert(profileData);

      if (error) throw error;

      toast({
        title: "Perfil salvo!",
        description: "Suas informações foram atualizadas"
      });
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o perfil",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-xl text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Minha Conta</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seu perfil e acompanhe seus pedidos
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="outline" onClick={signOut} size="sm" className="hover:bg-primary hover:text-primary-foreground">
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Meu Perfil</TabsTrigger>
            <TabsTrigger value="orders">Meus Pedidos ({orders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription>
                  Mantenha seus dados atualizados para um melhor atendimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço de Entrega</Label>
                  <Input
                    id="address"
                    value={profile.address}
                    onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Rua, número, bairro, cidade..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={saveProfile} disabled={saving} className="flex-1">
                    {saving ? 'Salvando...' : 'Salvar Perfil'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-4">
              {orders.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Você ainda não fez nenhum pedido
                    </p>
                  </CardContent>
                </Card>
              ) : (
                orders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            Pedido #{order.order_code || order.id.slice(0, 8)}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(order.created_at).toLocaleString('pt-BR')}
                            </span>
                            <span>{order.delivery_businesses.name}</span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant={statusColors[order.status as keyof typeof statusColors]}>
                            {statusTranslations[order.status as keyof typeof statusTranslations]}
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`/menu/${order.delivery_id}`, '_blank')}
                            className="text-xs ml-2 hover:bg-primary hover:text-primary-foreground"
                          >
                            Ver Cardápio
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Itens do pedido */}
                        <div>
                          <h4 className="font-medium text-sm mb-2">Itens:</h4>
                          <div className="space-y-1">
                            {order.order_items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.quantity}x {item.menu_items.name}</span>
                                <span>{formatCurrency(item.quantity * item.unit_price)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Total */}
                        <div className="border-t pt-2">
                          <div className="flex justify-between font-semibold">
                            <span>Total:</span>
                            <span>{formatCurrency(Number(order.total_amount))}</span>
                          </div>
                        </div>

                        {/* Endereço de entrega */}
                        {order.customer_address && (
                          <div className="text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {order.customer_address}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerDashboard;