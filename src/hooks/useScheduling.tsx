import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useScheduling = (businessId: string) => {
  const [allowScheduling, setAllowScheduling] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedulingSettings = async () => {
      if (!businessId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('delivery_businesses')
          .select('allow_scheduling')
          .eq('id', businessId)
          .single();

        if (error) throw error;
        
        setAllowScheduling(data?.allow_scheduling || false);
      } catch (error) {
        console.error('Error fetching scheduling settings:', error);
        setAllowScheduling(false);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedulingSettings();
  }, [businessId]);

  const getMinScheduleDateTime = () => {
    const now = new Date();
    // Permitir agendamento para pelo menos 1 hora a partir de agora
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16); // Format para datetime-local input
  };

  const formatScheduleDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return '';
    
    const date = new Date(dateTimeString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return {
    allowScheduling,
    loading,
    getMinScheduleDateTime,
    formatScheduleDateTime
  };
};