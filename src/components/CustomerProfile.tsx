import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuthWithRole } from '@/hooks/useAuthWithRole';
import { supabase } from '@/integrations/supabase/client';
import { User, Phone, MapPin } from 'lucide-react';

interface CustomerProfileData {
  name: string;
  phone: string;
  address: string;
}

export default function CustomerProfile() {
  const { toast } = useToast();
  const { user } = useAuthWithRole();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<CustomerProfileData>({
    name: '',
    phone: '',
    address: ''
  });

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

  return (
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
  );
}