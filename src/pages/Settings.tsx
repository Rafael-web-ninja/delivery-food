import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BusinessHours from '@/components/BusinessHours';
import PaymentMethodManagement from '@/components/PaymentMethodManagement';
import { useNavigate } from 'react-router-dom';
import { LoadingButton } from '@/components/ui/loading-button';
import { ArrowLeft, Save, Store } from 'lucide-react';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import ImageUpload from '@/components/ImageUpload';

interface BusinessData {
  id: string;
  name: string;
  description: string;
  phone: string;
  address: string;
  logo_url: string;
  delivery_fee: number;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
}

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
    delivery_fee: 0,
    primary_color: '#2563eb',
    secondary_color: '#64748b',
    accent_color: '#059669',
    background_color: '#ffffff',
    text_color: '#1e293b'
  });
  const [loading, setLoading] = useState(true);

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
        .single();

      if (data) {
        setBusinessData(data);
      } else if (error) {
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
      const { error } = await supabase
        .from('delivery_businesses')
        .update({
          name: businessData.name,
          description: businessData.description,
          phone: businessData.phone,
          address: businessData.address,
          logo_url: businessData.logo_url,
          delivery_fee: businessData.delivery_fee,
          primary_color: businessData.primary_color,
          secondary_color: businessData.secondary_color,
          accent_color: businessData.accent_color,
          background_color: businessData.background_color,
          text_color: businessData.text_color
        })
        .eq('id', businessData.id);

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
            <TabsTrigger value="hours">Horários</TabsTrigger>
            <TabsTrigger value="colors">Personalização</TabsTrigger>
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

          <TabsContent value="hours">
            <BusinessHours />
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
                    <Label htmlFor="accent_color">Cor de Destaque</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accent_color"
                        type="color"
                        value={businessData.accent_color}
                        onChange={(e) => setBusinessData(prev => ({ ...prev, accent_color: e.target.value }))}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={businessData.accent_color}
                        onChange={(e) => setBusinessData(prev => ({ ...prev, accent_color: e.target.value }))}
                        placeholder="#059669"
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
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;