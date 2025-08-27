import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { User, Phone, MapPin, Mail } from 'lucide-react';
import PasswordChangeForm from './PasswordChangeForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface CustomerProfileData {
  name: string;
  phone: string;
  address: string;
}

interface EmailChangeData {
  newEmail: string;
  password: string;
}

export default function CustomerProfile() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<CustomerProfileData>({
    name: '',
    phone: '',
    address: ''
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
      const { data } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setProfileData({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const handleInputChange = (field: keyof CustomerProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const { data: existingProfile } = await supabase
        .from('customer_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (existingProfile) {
        // Atualizar perfil existente
        await supabase
          .from('customer_profiles')
          .update(profileData)
          .eq('user_id', user?.id);
      } else {
        // Criar novo perfil
        await supabase
          .from('customer_profiles')
          .insert({
            user_id: user?.id,
            ...profileData
          });
      }

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas informações.",
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
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
          
          <div>
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço padrão
            </Label>
            <Input
              id="address"
              value={profileData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Rua, número, bairro, cidade"
            />
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