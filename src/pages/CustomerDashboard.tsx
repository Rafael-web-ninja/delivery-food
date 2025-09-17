import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Phone, MapPin, Clock, Package, Star, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, statusTranslations as statusLabels } from '@/lib/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDisplayName } from '@/lib/auth-utils';
import PasswordChangeForm from '@/components/PasswordChangeForm';
import { maskPhone, unmaskPhone, isValidPhone } from '@/lib/phone-utils';
import { maskZipCode, unmaskZipCode, isValidZipCode, fetchAddressByZipCode } from '@/lib/viacep-utils';


interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  zip_code: string;
  street: string;
  street_number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
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
    zip_code: '',
    street: '',
    street_number: '',
    neighborhood: '',
    city: '',
    state: '',
    complement: ''
  });
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

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
        // Apply masking for display
        setProfile({
          ...data,
          phone: data.phone ? maskPhone(data.phone) : '',
          zip_code: data.zip_code ? maskZipCode(data.zip_code) : ''
        });
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
      const userId = user?.id;
      if (!userId) throw new Error('No authenticated user');

      // Normalize data for database storage
      const normalize = (v: string) => (v?.trim ? v.trim() : v) || '';

      // Use the RPC function as the primary method
      const { data, error } = await supabase.rpc('upsert_customer_profile', {
        p_user_id: userId,
        p_name: normalize(profile.name),
        p_phone: unmaskPhone(profile.phone || ''),
        p_zip_code: unmaskZipCode(profile.zip_code || ''),
        p_street: normalize(profile.street),
        p_street_number: normalize(profile.street_number),
        p_neighborhood: normalize(profile.neighborhood),
        p_city: normalize(profile.city),
        p_state: normalize(profile.state).toUpperCase(),
        p_complement: normalize(profile.complement)
      });

      if (error) {
        console.error('[RPC ERROR]', error);
        
        // Fallback to direct upsert if RPC fails
        const profileData = {
          user_id: userId,
          name: normalize(profile.name),
          phone: unmaskPhone(profile.phone || ''),
          zip_code: unmaskZipCode(profile.zip_code || ''),
          street: normalize(profile.street),
          street_number: normalize(profile.street_number),
          neighborhood: normalize(profile.neighborhood),
          city: normalize(profile.city),
          state: normalize(profile.state).toUpperCase(),
          complement: normalize(profile.complement)
        };

        const { error: upsertError } = await supabase
          .from('customer_profiles')
          .upsert(profileData, { onConflict: 'user_id' });

        if (upsertError) throw upsertError;
      }

      // Refresh profile after save
      await fetchProfile();

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

  const handlePhoneChange = (value: string) => {
    const maskedPhone = maskPhone(value);
    setProfile(prev => ({ ...prev, phone: maskedPhone }));
  };

  const handleZipCodeChange = async (value: string) => {
    const maskedZipCode = maskZipCode(value);
    setProfile(prev => ({ ...prev, zip_code: maskedZipCode }));

    // Auto-fill address when zip code is complete  
    if (isValidZipCode(maskedZipCode)) {
      setCepLoading(true);
      try {
        const addressData = await fetchAddressByZipCode(maskedZipCode);
        if (addressData) {
          setProfile(prev => ({
            ...prev,
            street: addressData.logradouro || '',
            neighborhood: addressData.bairro || '',
            city: addressData.localidade || '',
            state: addressData.uf || ''
          }));
          
          toast({
            title: "Endereço encontrado!",
            description: "Os campos de endereço foram preenchidos automaticamente.",
          });
        }
      } catch (error: any) {
        toast({
          title: "Erro ao buscar CEP",
          description: error.message || "Não foi possível encontrar o endereço.",
          variant: "destructive"
        });
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso"
      });
    } catch (error) {
      console.error('Erro no logout:', error);
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao fazer logout",
        variant: "destructive"
      });
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
            <h1 className="text-3xl font-bold text-foreground">
              Bem-vindo, {getDisplayName(user, profile)}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seu perfil e acompanhe seus pedidos
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="outline" onClick={handleSignOut} size="sm" className="hover:bg-primary hover:text-primary-foreground">
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
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefone *
                    </Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                  </div>
                </div>

                {/* Address Section */}
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="text-lg font-medium">Endereço de Entrega</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zip_code">CEP *</Label>
                      <div className="relative">
                        <Input
                          id="zip_code"
                          value={profile.zip_code}
                          onChange={(e) => handleZipCodeChange(e.target.value)}
                          placeholder="00000-000"
                          maxLength={9}
                        />
                        {cepLoading && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="street">Rua/Logradouro *</Label>
                      <Input
                        id="street"
                        value={profile.street}
                        onChange={(e) => setProfile(prev => ({ ...prev, street: e.target.value }))}
                        placeholder="Nome da rua"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="street_number">Número *</Label>
                      <Input
                        id="street_number"
                        value={profile.street_number}
                        onChange={(e) => setProfile(prev => ({ ...prev, street_number: e.target.value }))}
                        placeholder="123"
                      />
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        value={profile.complement}
                        onChange={(e) => setProfile(prev => ({ ...prev, complement: e.target.value }))}
                        placeholder="Apto, casa, bloco, etc."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">Bairro *</Label>
                      <Input
                        id="neighborhood"
                        value={profile.neighborhood}
                        onChange={(e) => setProfile(prev => ({ ...prev, neighborhood: e.target.value }))}
                        placeholder="Nome do bairro"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        value={profile.city}
                        onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Nome da cidade"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado *</Label>
                      <Input
                        id="state"
                        value={profile.state}
                        onChange={(e) => setProfile(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={saveProfile} disabled={saving} className="flex-1">
                    {saving ? 'Salvando...' : 'Salvar Perfil'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Password Change Section */}
            <PasswordChangeForm className="mt-6" />
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
                            <span>{order.delivery_businesses?.name ?? 'Estabelecimento'}</span>
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
                                <span>{item.quantity}x {item.menu_items?.name || 'Item'}</span>
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