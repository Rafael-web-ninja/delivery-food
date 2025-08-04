import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BusinessStatusProps {
  businessId: string;
}

export default function BusinessStatus({ businessId }: BusinessStatusProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBusinessStatus();
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

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse"></div>
        <span className="text-sm text-gray-500">Verificando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div 
        className={`w-3 h-3 rounded-full ${
          isOpen ? 'bg-green-500' : 'bg-red-500'
        }`}
      ></div>
      <span className={`text-sm font-medium ${
        isOpen ? 'text-green-600' : 'text-red-600'
      }`}>
        {isOpen ? 'Aberto' : 'Fechado'}
      </span>
    </div>
  );
}