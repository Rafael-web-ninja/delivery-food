import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';

interface DeliveryFeeDisplayProps {
  businessId: string;
}

export const DeliveryFeeDisplay = ({ businessId }: DeliveryFeeDisplayProps) => {
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  useEffect(() => {
    const fetchDeliveryFee = async () => {
      const { data } = await supabase
        .from('delivery_businesses')
        .select('delivery_fee')
        .eq('id', businessId)
        .single();
      
      if (data?.delivery_fee) {
        setDeliveryFee(Number(data.delivery_fee));
      }
    };

    fetchDeliveryFee();
  }, [businessId]);

  if (deliveryFee === 0) return null;

  return (
    <div className="flex justify-between text-sm py-1">
      <span>Taxa de entrega</span>
      <span>{formatCurrency(deliveryFee)}</span>
    </div>
  );
};

interface TotalWithDeliveryProps {
  businessId: string;
  subtotal: number;
  isPickup?: boolean;
}

export const TotalWithDelivery = ({ businessId, subtotal, isPickup = false }: TotalWithDeliveryProps) => {
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  useEffect(() => {
    const fetchDeliveryFee = async () => {
      const { data } = await supabase
        .from('delivery_businesses')
        .select('delivery_fee')
        .eq('id', businessId)
        .single();
      
      if (data?.delivery_fee && !isPickup) {
        setDeliveryFee(Number(data.delivery_fee));
      } else {
        setDeliveryFee(0);
      }
    };

    fetchDeliveryFee();
  }, [businessId, isPickup]);

  return <span>{formatCurrency(subtotal + deliveryFee)}</span>;
};