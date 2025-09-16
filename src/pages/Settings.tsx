import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BusinessHours from '@/components/BusinessHours';
import PaymentMethodManagement from '@/components/PaymentMethodManagement';
import DeliveryAreasManagement from '@/components/DeliveryAreasManagement';
import { useNavigate } from 'react-router-dom';
import { LoadingButton } from '@/components/ui/loading-button';
import { ArrowLeft, Save, Store, QrCode } from 'lucide-react';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import ImageUpload from '@/components/ImageUpload';
import PasswordChangeForm from '@/components/PasswordChangeForm';
import { useSubscription } from '@/hooks/useSubscription';
import QRCodeDialog from '@/components/QRCodeDialog';
import CouponManagement from '@/components/CouponManagement';

interface BusinessData {
  id: string;
  name: string;
  description: string;
  phone: string;
  address: string;
  logo_url: string;
  slug?: string;
  cnpj: string;
  delivery_fee: number;
  min_order_value: number;
  delivery_time_minutes: number;
  delivery_radius_km: number;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  button_color: string;
  button_text_color: string;
  cart_button_color: string;
  cart_button_text_color: string;
  delivery_time_bg_color: string;
  delivery_time_text_color: string;
  accept_orders_when_closed: boolean;
  allow_scheduling: boolean;
  allow_pickup: boolean;
}

// Security Tab Component
const SecurityTab = ({ user }: { user: any }) => {
  const { toast } = useToast();
  const { checkSubscription } = useSubscription();
  const [newEmail, setNewEmail] = useState('');

  const handleEmailChange = async () => {
    if (!newEmail) {
      toast({
        title: "Erro",
        description: "Digite o novo email",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      toast({
        title: "Email alterado!",
        description: "Verifique seu email para confirmar a alteração"
      });
      
      setNewEmail('');
      
      // Check subscription after email change to sync with Stripe
      setTimeout(() => {
        checkSubscription();
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Segurança</CardTitle>
        <CardDescription>
          Altere seu email ou senha
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Change Email Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Alterar Email</h3>
          <div className="space-y-2">
            <Label htmlFor="current-email">Email Atual</Label>
            <Input
              id="current-email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-email">Novo Email</Label>
            <Input
              id="new-email"
              type="email"
              placeholder="novo@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <Button onClick={handleEmailChange}>
            Alterar Email
          </Button>
        </div>

        {/* Change Password Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Alterar Senha</h3>
          <PasswordChangeForm />
        </div>
      </CardContent>
    </Card>
  );
};

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
const [businessData, setBusinessData] = useState<BusinessData>({
  id: '',
  name: '',
  description: '',
  phone: '',
  address: '',
  logo_url: '',
  slug: '',
  cnpj: '',
  delivery_fee: 0,
  min_order_value: 0,
  delivery_time_minutes: 30,
  delivery_radius_km: 10,
  primary_color: '#2563eb',
  secondary_color: '#64748b',
  accent_color: '#059669',
  background_color: '#ffffff',
  text_color: '#1e293b',
  button_color: '#16A34A',
  button_text_color: '#FFFFFF',
  cart_button_color: '#16A34A',
  cart_button_text_color: '#FFFFFF',
  delivery_time_bg_color: '#000000',
  delivery_time_text_color: '#FFFFFF',
  accept_orders_when_closed: false,
  allow_scheduling: false,
  allow_pickup: false
});
  const [loading, setLoading] = useState(true);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  const { execute: saveSettings, loading: saving } = useAsyncOperation({
    successMessage: "Configurações salvas com sucesso!",
    onSuccess: () => {
      // Opcional: redirecionar de volta ao dashboard
    }
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBusinessData();
    }
  }, [user]);

  const fetchBusinessData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('delivery_businesses')
        .select('*')
        .eq('owner_id', user?.id)
        .maybeSingle();

      if (data) {
        setBusinessData(data);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do seu delivery",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    await saveSettings(async () => {
      // Garante que existe um negócio para este usuário
      let currentBusinessId = businessData.id;
      if (!currentBusinessId) {
        const { data: created, error: createError } = await supabase
          .from('delivery_businesses')
          .insert({
            owner_id: user?.id,
            name: businessData.name || (user?.user_metadata?.business_name ?? 'Meu Delivery'),
            description: businessData.description || 'Descrição do delivery'
          })
          .select()
          .single();
        if (createError) throw createError;
        if (created?.id) {
          currentBusinessId = created.id;
          setBusinessData(prev => ({ ...prev, id: created.id }));
        }
      }

const normalizedSlug = (businessData.slug || '').toLowerCase().trim();
if (normalizedSlug) {
  const { data: existing } = await supabase
    .from('delivery_businesses')
    .select('id')
    .eq('slug', normalizedSlug)
    .neq('id', currentBusinessId)
    .maybeSingle();
  if (existing) throw new Error('Este link já está em uso. Escolha outro.');
}

const { error } = await supabase
  .from('delivery_businesses')
  .update({
    name: businessData.name,
    description: businessData.description,
    phone: businessData.phone,
    address: businessData.address,
    logo_url: businessData.logo_url,
    slug: normalizedSlug || null,
    cnpj: businessData.cnpj,
    delivery_fee: businessData.delivery_fee,
    min_order_value: businessData.min_order_value,
    delivery_time_minutes: businessData.delivery_time_minutes,
    primary_color: businessData.primary_color,
    secondary_color: businessData.secondary_color,
    accent_color: businessData.accent_color,
    background_color: businessData.background_color,
    text_color: businessData.text_color,
    button_color: businessData.button_color,
    button_text_color: businessData.button_text_color,
    cart_button_color: businessData.cart_button_color,
    cart_button_text_color: businessData.cart_button_text_color,
    delivery_time_bg_color: businessData.delivery_time_bg_color,
    delivery_time_text_color: businessData.delivery_time_text_color,
    accept_orders_when_closed: businessData.accept_orders_when_closed,
    allow_scheduling: businessData.allow_scheduling,
    allow_pickup: businessData.allow_pickup
  })
  .eq('id', currentBusinessId);

      if (error) throw error;
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="animate-shimmer h-8 bg-muted rounded" />
          <div className="animate-shimmer h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Configurações</h1>
        
        <Tabs defaultValue="business" className="space-y-6">
          <TabsList>
            <TabsTrigger value="business">Dados do Negócio</TabsTrigger>
            <TabsTrigger value="delivery">Entrega</TabsTrigger>
            <TabsTrigger value="hours">Horários</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
            <TabsTrigger value="coupons">Cupons</TabsTrigger>
            <TabsTrigger value="colors">Personalização</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
          </TabsList>

          <TabsContent value="business">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  Informações do Delivery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Delivery *</Label>
                    <Input
                      id="name"
                      value={businessData.name}
                      onChange={(e) => setBusinessData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Pizza Express"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={businessData.cnpj}
                      onChange={(e) => setBusinessData(prev => ({ ...prev, cnpj: e.target.value }))}
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={businessData.phone}
                      onChange={(e) => setBusinessData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Link do Cardápio</Label>
                  <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] items-center gap-2">
                    <div className="text-sm text-muted-foreground">{window.location.origin}/menu/</div>
                    <Input
                      id="slug"
                      value={businessData.slug || ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const normalized = raw
                          .toLowerCase()
                          .trim()
                          .replace(/\s+/g, '-')
                          .replace(/[^a-z0-9-]/g, '')
                          .replace(/-+/g, '-');
                        setBusinessData(prev => ({ ...prev, slug: normalized }));
                      }}
                      placeholder="pizzariapedro"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-xs text-muted-foreground flex-1">
                      Também acessível por: {window.location.origin}/{businessData.slug || 'seu-slug'}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setQrDialogOpen(true)}
                      disabled={!businessData.id}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      QR Code do Cardápio
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={businessData.description}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva seu delivery..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Textarea
                    id="address"
                    value={businessData.address}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Rua, número, bairro, cidade..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <ImageUpload
                    currentUrl={businessData.logo_url}
                    onUrlChange={(url) => setBusinessData(prev => ({ ...prev, logo_url: url }))}
                    label="Logo do Delivery (opcional)"
                    folder="logos"
                  />
                </div>

<div className="space-y-2">
  <Label htmlFor="delivery_fee">Taxa de entrega (R$)</Label>
  <Input
    id="delivery_fee"
    type="number"
    step="0.01"
    min="0"
    value={businessData.delivery_fee}
    onChange={(e) => setBusinessData(prev => ({ ...prev, delivery_fee: Number(e.target.value) }))}
    placeholder="0.00"
  />
</div>

<div className="space-y-2">
  <Label htmlFor="min_order_value">Pedido mínimo (R$)</Label>
  <Input
    id="min_order_value"
    type="number"
    step="0.01"
    min="0"
    value={businessData.min_order_value}
    onChange={(e) => setBusinessData(prev => ({ ...prev, min_order_value: Number(e.target.value) }))}
    placeholder="0.00"
  />
</div>

<div className="space-y-2">
  <Label htmlFor="delivery_time_minutes">Tempo de entrega (min)</Label>
  <Input
    id="delivery_time_minutes"
    type="number"
    min="0"
    value={businessData.delivery_time_minutes}
    onChange={(e) => setBusinessData(prev => ({ ...prev, delivery_time_minutes: Number(e.target.value) }))}
    placeholder="30"
  />
</div>

{/* Aceitar pedidos quando fechado */}
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <div className="space-y-0.5">
      <Label htmlFor="accept_orders_when_closed">Aceitar pedidos quando fechado</Label>
      <p className="text-sm text-muted-foreground">
        Permite que clientes façam pedidos mesmo fora do horário de funcionamento
      </p>
    </div>
    <Switch
      id="accept_orders_when_closed"
      checked={businessData.accept_orders_when_closed}
      onCheckedChange={(checked) => setBusinessData(prev => ({ ...prev, accept_orders_when_closed: checked }))}
    />
  </div>
</div>

{/* Permitir agendamento de pedidos */}
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <div className="space-y-0.5">
      <Label htmlFor="allow_scheduling">Permitir agendamento de pedidos</Label>
      <p className="text-sm text-muted-foreground">
        Permite que clientes agendem pedidos para data e horário específicos
      </p>
    </div>
    <Switch
      id="allow_scheduling"
      checked={businessData.allow_scheduling}
      onCheckedChange={(checked) => setBusinessData(prev => ({ ...prev, allow_scheduling: checked }))}
    />
  </div>
</div>

{/* Permitir retirada de pedidos */}
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <div className="space-y-0.5">
      <Label htmlFor="allow_pickup">Permitir retirada de pedidos</Label>
      <p className="text-sm text-muted-foreground">
        Permite que clientes escolham retirar o pedido no local ao invés de delivery
      </p>
    </div>
    <Switch
      id="allow_pickup"
      checked={businessData.allow_pickup}
      onCheckedChange={(checked) => setBusinessData(prev => ({ ...prev, allow_pickup: checked }))}
    />
  </div>
</div>

                <div className="flex gap-2 pt-4">
                  <LoadingButton
                    onClick={handleSave}
                    loading={saving}
                    loadingText="Salvando..."
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Dados
                  </LoadingButton>
                  <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    Voltar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery">
            <DeliveryAreasManagement 
              businessId={businessData.id}
              deliveryRadius={businessData.delivery_radius_km}
              onDeliveryRadiusChange={(radius) => 
                setBusinessData(prev => ({ ...prev, delivery_radius_km: radius }))
              }
            />
          </TabsContent>

          <TabsContent value="hours">
            <BusinessHours />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentMethodManagement />
          </TabsContent>

          <TabsContent value="coupons">
            <CouponManagement />
          </TabsContent>

          <TabsContent value="colors">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Personalização de Cores</CardTitle>
                <CardDescription>
                  Customize as cores do seu cardápio público
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-6">
                  {/* Cores Básicas */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Cores do Tema</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primary_color">Cor Primária</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primary_color"
                            type="color"
                            value={businessData.primary_color}
                            onChange={(e) => setBusinessData(prev => ({ ...prev, primary_color: e.target.value }))}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={businessData.primary_color}
                            onChange={(e) => setBusinessData(prev => ({ ...prev, primary_color: e.target.value }))}
                            placeholder="#2563eb"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secondary_color">Cor Secundária</Label>
                        <div className="flex gap-2">
                          <Input
                            id="secondary_color"
                            type="color"
                            value={businessData.secondary_color}
                            onChange={(e) => setBusinessData(prev => ({ ...prev, secondary_color: e.target.value }))}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={businessData.secondary_color}
                            onChange={(e) => setBusinessData(prev => ({ ...prev, secondary_color: e.target.value }))}
                            placeholder="#64748b"
                          />
                        </div>
                      </div>


                      <div className="space-y-2">
                        <Label htmlFor="background_color">Cor de Fundo</Label>
                        <div className="flex gap-2">
                          <Input
                            id="background_color"
                            type="color"
                            value={businessData.background_color}
                            onChange={(e) => setBusinessData(prev => ({ ...prev, background_color: e.target.value }))}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={businessData.background_color}
                            onChange={(e) => setBusinessData(prev => ({ ...prev, background_color: e.target.value }))}
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="text_color">Cor do Texto</Label>
                        <div className="flex gap-2">
                          <Input
                            id="text_color"
                            type="color"
                            value={businessData.text_color}
                            onChange={(e) => setBusinessData(prev => ({ ...prev, text_color: e.target.value }))}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={businessData.text_color}
                            onChange={(e) => setBusinessData(prev => ({ ...prev, text_color: e.target.value }))}
                            placeholder="#1e293b"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cores dos Botões */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Cores dos Botões</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="button_color">Cor do Botão "Adicionar"</Label>
                        <div className="flex gap-2">
                          <Input
                            id="button_color"
                            type="color"
                            value={businessData.button_color}
                            onChange={(e) => setBusinessData(prev => ({ ...prev, button_color: e.target.value }))}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={businessData.button_color}
                            onChange={(e) => setBusinessData(prev => ({ ...prev, button_color: e.target.value }))}
                            placeholder="#16A34A"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="button_text_color">Cor do Texto do Botão</Label>
                        <div className="flex gap-2">
                          <Input
                            id="button_text_color"
                            type="color"
                            value={businessData.button_text_color}
                            onChange={(e) => setBusinessData(prev => ({ ...prev, button_text_color: e.target.value }))}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={businessData.button_text_color}
                            onChange={(e) => setBusinessData(prev => ({ ...prev, button_text_color: e.target.value }))}
                            placeholder="#FFFFFF"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cart_button_color">Cor do Botão do Carrinho</Label>
                        <div className="flex gap-2">
                          <Input
                            id="cart_button_color"
                            type="color"
                            value={businessData.cart_button_color}
                            onChange={(e) => setBusinessData(prev => ({ ...prev, cart_button_color: e.target.value }))}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={businessData.cart_button_color}
                            onChange={(e) => setBusinessData(prev => ({ ...prev, cart_button_color: e.target.value }))}
                            placeholder="#16A34A"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cart_button_text_color">Cor do Texto do Carrinho</Label>
                        <div className="flex gap-2">
                          <Input
                            id="cart_button_text_color"
                            type="color"
                            value={businessData.cart_button_text_color}
                            onChange={(e) => setBusinessData(prev => ({ ...prev, cart_button_text_color: e.target.value }))}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={businessData.cart_button_text_color}
                            onChange={(e) => setBusinessData(prev => ({ ...prev, cart_button_text_color: e.target.value }))}
                            placeholder="#FFFFFF"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cores do Tempo de Entrega */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Card de Tempo de Entrega</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="delivery_time_bg_color">Cor de Fundo</Label>
                        <div className="flex gap-2">
                          <Input
                            id="delivery_time_bg_color"
                            type="color"
                            value={businessData.delivery_time_bg_color}
                            onChange={(e) => setBusinessData(prev => ({ ...prev, delivery_time_bg_color: e.target.value }))}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={businessData.delivery_time_bg_color}
                            onChange={(e) => setBusinessData(prev => ({ ...prev, delivery_time_bg_color: e.target.value }))}
                            placeholder="#000000"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="delivery_time_text_color">Cor do Texto</Label>
                        <div className="flex gap-2">
                          <Input
                            id="delivery_time_text_color"
                            type="color"
                            value={businessData.delivery_time_text_color}
                            onChange={(e) => setBusinessData(prev => ({ ...prev, delivery_time_text_color: e.target.value }))}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={businessData.delivery_time_text_color}
                            onChange={(e) => setBusinessData(prev => ({ ...prev, delivery_time_text_color: e.target.value }))}
                            placeholder="#FFFFFF"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <LoadingButton
                    onClick={handleSave}
                    loading={saving}
                    loadingText="Salvando..."
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </LoadingButton>
                  <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <SecurityTab user={user} />
          </TabsContent>
        </Tabs>

        {/* QR Code Dialog */}
        <QRCodeDialog
          open={qrDialogOpen}
          onOpenChange={setQrDialogOpen}
          url={`${window.location.origin}/menu/${businessData.slug || businessData.id}`}
          businessName={businessData.name || 'Cardápio'}
        />
      </div>
    </div>
  );
};

export default Settings;