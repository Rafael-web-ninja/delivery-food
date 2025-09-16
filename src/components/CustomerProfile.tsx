import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { User, Phone, MapPin, Mail, Loader2 } from 'lucide-react';
import PasswordChangeForm from './PasswordChangeForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { maskPhone, unmaskPhone, isValidPhone } from '@/lib/phone-utils';
import { maskZipCode, unmaskZipCode, isValidZipCode, fetchAddressByZipCode } from '@/lib/viacep-utils';

interface CustomerProfileData {
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

interface EmailChangeData {
  newEmail: string;
  password: string;
}

export default function CustomerProfile() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [profileData, setProfileData] = useState<CustomerProfileData>({
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
  const [emailData, setEmailData] = useState<EmailChangeData>({
    newEmail: '',
    password: ''
  });
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
        return;
      }

      if (data) {
        setProfileData({
          name: data.name || '',
          phone: data.phone || '',
          zip_code: data.zip_code || '',
          street: data.street || '',
          street_number: data.street_number || '',
          neighborhood: data.neighborhood || '',
          city: data.city || '',
          state: data.state || '',
          complement: data.complement || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const handleInputChange = (field: keyof CustomerProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (value: string) => {
    const maskedPhone = maskPhone(value);
    setProfileData(prev => ({ ...prev, phone: maskedPhone }));
  };

  const handleZipCodeChange = async (value: string) => {
    const maskedZipCode = maskZipCode(value);
    setProfileData(prev => ({ ...prev, zip_code: maskedZipCode }));

    // Auto-fill address when zip code is complete
    if (isValidZipCode(maskedZipCode)) {
      setCepLoading(true);
      try {
        const addressData = await fetchAddressByZipCode(maskedZipCode);
        if (addressData) {
          setProfileData(prev => ({
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

  const saveProfile = async () => {
    setLoading(true);
    try {
      // Update the existing profile record
      const { error } = await supabase
        .from('customer_profiles')
        .update(profileData)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar suas informações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!emailData.newEmail || !emailData.password) {
      toast({
        title: "Dados incompletos",
        description: "Preencha o novo e-mail e sua senha atual.",
        variant: "destructive"
      });
      return;
    }

    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: emailData.newEmail,
        password: emailData.password
      });

      if (error) throw error;

      toast({
        title: "E-mail atualizado!",
        description: "Verifique seu novo e-mail para confirmar a alteração.",
      });

      setEmailData({ newEmail: '', password: '' });
    } catch (error: any) {
      console.error('Erro ao alterar e-mail:', error);
      toast({
        title: "Erro ao alterar e-mail",
        description: error.message || "Não foi possível alterar o e-mail.",
        variant: "destructive"
      });
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Meu Perfil</CardTitle>
          <CardDescription>
            Mantenha suas informações atualizadas para facilitar seus pedidos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nome completo
            </Label>
            <Input
              id="name"
              value={profileData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>
          
          <div>
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefone
            </Label>
            <Input
              id="phone"
              value={profileData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="(11) 99999-9999"
              maxLength={15}
            />
          </div>
        </CardContent>
      </Card>

      {/* Address Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Endereço
          </CardTitle>
          <CardDescription>
            Informe seu CEP para preenchimento automático do endereço
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zip_code">CEP *</Label>
              <div className="relative">
                <Input
                  id="zip_code"
                  value={profileData.zip_code}
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
            
            <div>
              <Label htmlFor="street">Rua/Logradouro *</Label>
              <Input
                id="street"
                value={profileData.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
                placeholder="Nome da rua"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="street_number">Número *</Label>
              <Input
                id="street_number"
                value={profileData.street_number}
                onChange={(e) => handleInputChange('street_number', e.target.value)}
                placeholder="123"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={profileData.complement}
                onChange={(e) => handleInputChange('complement', e.target.value)}
                placeholder="Apto, casa, bloco, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input
                id="neighborhood"
                value={profileData.neighborhood}
                onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                placeholder="Nome do bairro"
              />
            </div>
            
            <div>
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                value={profileData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Nome da cidade"
              />
            </div>
            
            <div>
              <Label htmlFor="state">Estado *</Label>
              <Input
                id="state"
                value={profileData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="UF"
                maxLength={2}
              />
            </div>
          </div>

          <Button onClick={saveProfile} disabled={loading} className="w-full">
            {loading ? 'Salvando...' : 'Salvar Perfil'}
          </Button>
        </CardContent>
      </Card>

      {/* Email Change Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Alterar E-mail</CardTitle>
          <CardDescription>
            E-mail atual: {user?.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="newEmail" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Novo e-mail
            </Label>
            <Input
              id="newEmail"
              type="email"
              value={emailData.newEmail}
              onChange={(e) => setEmailData(prev => ({ ...prev, newEmail: e.target.value }))}
              placeholder="novo@email.com"
            />
          </div>
          
          <div>
            <Label htmlFor="confirmPassword">Senha atual para confirmar</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={emailData.password}
              onChange={(e) => setEmailData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Digite sua senha atual"
            />
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                disabled={!emailData.newEmail || !emailData.password || emailLoading} 
                className="w-full"
                variant="outline"
              >
                {emailLoading ? 'Alterando...' : 'Alterar E-mail'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar alteração de e-mail</AlertDialogTitle>
                <AlertDialogDescription>
                  Você está prestes a alterar seu e-mail de <strong>{user?.email}</strong> para <strong>{emailData.newEmail}</strong>. 
                  Um e-mail de confirmação será enviado para o novo endereço. Esta ação não pode ser desfeita automaticamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleEmailChange}>
                  Confirmar Alteração
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Password Change Section */}
      <PasswordChangeForm className="mt-6" />
    </div>
  );
}