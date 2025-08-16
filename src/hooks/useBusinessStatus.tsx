import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BusinessStatusResult {
  isOpen: boolean;
  loading: boolean;
  canAcceptOrders: boolean;
}

export function useBusinessStatus(businessId: string, acceptOrdersWhenClosed: boolean): BusinessStatusResult {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    
    checkBusinessStatus();
    
    // Verificar status a cada minuto
    const interval = setInterval(checkBusinessStatus, 60000);
    return () => clearInterval(interval);
  }, [businessId]);

  const checkBusinessStatus = async () => {
    try {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = domingo, 1 = segunda, etc
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM

      const { data: hours } = await supabase
        .from('business_hours')
        .select('*')
        .eq('business_id', businessId)
        .eq('day_of_week', currentDay)
        .eq('is_active', true)
        .single();

      if (hours && currentTime >= hours.open_time && currentTime <= hours.close_time) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const canAcceptOrders = isOpen || acceptOrdersWhenClosed;

  return {
    isOpen,
    loading,
    canAcceptOrders
  };
}