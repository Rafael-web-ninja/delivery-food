import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';

interface DeliveryArea {
  id: string;
  zip_code: string;
}

interface DeliveryAreasManagementProps {
  businessId: string;
  deliveryRadius: number;
  onDeliveryRadiusChange: (radius: number) => void;
}

export default function DeliveryAreasManagement({ 
  businessId, 
  deliveryRadius, 
  onDeliveryRadiusChange 
}: DeliveryAreasManagementProps) {
  const { toast } = useToast();
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
  const [newZipCode, setNewZipCode] = useState('');
  const [loading, setLoading] = useState(true);

  const { execute: addZipCode, loading: adding } = useAsyncOperation({
    successMessage: "CEP adicionado com sucesso!",
  });

  const { execute: removeZipCode, loading: removing } = useAsyncOperation({
    successMessage: "CEP removido com sucesso!",
  });

  useEffect(() => {
    if (businessId) {
      fetchDeliveryAreas();
    }
  }, [businessId]);

  const fetchDeliveryAreas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('delivery_areas')
        .select('id, zip_code')
        .eq('business_id', businessId)
        .order('zip_code');

      if (error) throw error;
      setDeliveryAreas(data || []);
    } catch (error) {
      console.error('Erro ao carregar áreas de entrega:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as áreas de entrega",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddZipCode = () => {
    addZipCode(async () => {
      if (!newZipCode.trim()) {
        throw new Error('Digite um CEP válido');
      }

      // Normalize ZIP code (remove non-numeric characters)
      const normalizedZip = newZipCode.replace(/\D/g, '');
      
      if (normalizedZip.length < 5) {
        throw new Error('CEP deve ter pelo menos 5 dígitos');
      }

      const { error } = await supabase
        .from('delivery_areas')
        .insert({
          business_id: businessId,
          zip_code: normalizedZip
        });

      if (error) {
        if (error.code === '23505') { // Unique violation
          throw new Error('CEP já cadastrado');
        }
        throw error;
      }

      setNewZipCode('');
      fetchDeliveryAreas();
    });
  };

  const handleRemoveZipCode = (areaId: string) => {
    removeZipCode(async () => {
      const { error } = await supabase
        .from('delivery_areas')
        .delete()
        .eq('id', areaId);

      if (error) throw error;
      
      fetchDeliveryAreas();
    });
  };

  const formatZipCode = (zipCode: string) => {
    if (zipCode.length === 8) {
      return `${zipCode.slice(0, 5)}-${zipCode.slice(5)}`;
    }
    return zipCode;
  };

  if (loading) {
    return <div>Carregando áreas de entrega...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Entrega</CardTitle>
        <CardDescription>
          Gerencie o raio de entrega e os CEPs atendidos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="delivery-radius">Raio de Entrega (km)</Label>
          <Input
            id="delivery-radius"
            type="number"
            value={deliveryRadius}
            onChange={(e) => onDeliveryRadiusChange(Number(e.target.value))}
            placeholder="10"
            min="1"
            max="50"
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Raio máximo para entrega em quilômetros
          </p>
        </div>

        <div>
          <Label>CEPs Atendidos</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Adicione os CEPs específicos que você atende
          </p>
          
          <div className="flex gap-2 mb-4">
            <Input
              value={newZipCode}
              onChange={(e) => setNewZipCode(e.target.value)}
              placeholder="Ex: 01234-567 ou 01234567"
              className="flex-1"
            />
            <Button 
              onClick={handleAddZipCode} 
              disabled={adding}
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-2">
            {deliveryAreas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                Nenhum CEP cadastrado. Adicione CEPs para restringir a área de entrega.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {deliveryAreas.map((area) => (
                  <Badge key={area.id} variant="secondary" className="flex items-center gap-2">
                    {formatZipCode(area.zip_code)}
                    <button
                      onClick={() => handleRemoveZipCode(area.id)}
                      disabled={removing}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}