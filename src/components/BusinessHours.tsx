import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthWithRole } from '@/hooks/useAuthWithRole';

interface BusinessHour {
  id?: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_active: boolean;
}

const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira', 
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

export default function BusinessHours() {
  const { toast } = useToast();
  const { user } = useAuthWithRole();
  const [loading, setLoading] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [hours, setHours] = useState<BusinessHour[]>([]);

  useEffect(() => {
    if (user) {
      loadBusinessAndHours();
    }
  }, [user]);

  const loadBusinessAndHours = async () => {
    try {
      // Buscar o negócio do usuário
      const { data: business } = await supabase
        .from('delivery_businesses')
        .select('id')
        .eq('owner_id', user?.id)
        .single();

      if (business) {
        setBusinessId(business.id);
        loadHours(business.id);
      }
    } catch (error) {
      console.error('Erro ao carregar negócio:', error);
    }
  };

  const loadHours = async (busId: string) => {
    try {
      const { data } = await supabase
        .from('business_hours')
        .select('*')
        .eq('business_id', busId)
        .order('day_of_week');

      if (data && data.length > 0) {
        // Mapear dados existentes
        const existingHours = data.reduce((acc, hour) => {
          acc[hour.day_of_week] = hour;
          return acc;
        }, {} as Record<number, any>);

        // Criar array completo com 7 dias
        const allHours = Array.from({ length: 7 }, (_, i) => 
          existingHours[i] || {
            day_of_week: i,
            open_time: '08:00',
            close_time: '18:00',
            is_active: false
          }
        );
        setHours(allHours);
      } else {
        // Criar horários padrão se não existirem
        const defaultHours = Array.from({ length: 7 }, (_, i) => ({
          day_of_week: i,
          open_time: '08:00',
          close_time: '18:00',
          is_active: false
        }));
        setHours(defaultHours);
      }
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
    }
  };

  const updateHour = (dayIndex: number, field: keyof BusinessHour, value: any) => {
    setHours(prev => prev.map(hour => 
      hour.day_of_week === dayIndex 
        ? { ...hour, [field]: value }
        : hour
    ));
  };

  const saveHours = async () => {
    if (!businessId) return;
    
    setLoading(true);
    try {
      // Deletar horários existentes
      await supabase
        .from('business_hours')
        .delete()
        .eq('business_id', businessId);

      // Inserir novos horários
      const hoursToInsert = hours
        .filter(hour => hour.is_active)
        .map(hour => ({
          business_id: businessId,
          day_of_week: hour.day_of_week,
          open_time: hour.open_time,
          close_time: hour.close_time,
          is_active: hour.is_active
        }));

      if (hoursToInsert.length > 0) {
        await supabase
          .from('business_hours')
          .insert(hoursToInsert);
      }

      toast({
        title: "Horários salvos!",
        description: "Os horários de funcionamento foram atualizados.",
      });
    } catch (error) {
      console.error('Erro ao salvar horários:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os horários.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horários de Funcionamento</CardTitle>
        <CardDescription>
          Configure os dias e horários que seu delivery funciona
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS_OF_WEEK.map((day, index) => {
          const hour = hours.find(h => h.day_of_week === index) || {
            day_of_week: index,
            open_time: '08:00',
            close_time: '18:00',
            is_active: false
          };

          return (
            <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="w-32 flex items-center">
                <input
                  type="checkbox"
                  checked={hour.is_active}
                  onChange={(e) => updateHour(index, 'is_active', e.target.checked)}
                  className="mr-3 h-4 w-4 accent-primary"
                  id={`day-${index}`}
                />
                <Label htmlFor={`day-${index}`} className="text-sm font-medium cursor-pointer">{day}</Label>
              </div>
              
              {hour.is_active && (
                <>
                  <div>
                    <Label className="text-sm">Abertura</Label>
                    <input
                      type="time"
                      value={hour.open_time}
                      onChange={(e) => updateHour(index, 'open_time', e.target.value)}
                      className="block mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Fechamento</Label>
                    <input
                      type="time"
                      value={hour.close_time}
                      onChange={(e) => updateHour(index, 'close_time', e.target.value)}
                      className="block mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </>
              )}
              
              {!hour.is_active && (
                <span className="text-muted-foreground text-sm">Fechado</span>
              )}
            </div>
          );
        })}

        <Button onClick={saveHours} disabled={loading} className="w-full">
          {loading ? 'Salvando...' : 'Salvar Horários'}
        </Button>
      </CardContent>
    </Card>
  );
}