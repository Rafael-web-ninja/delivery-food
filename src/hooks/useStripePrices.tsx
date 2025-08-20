import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StripePrice {
  productId: string;
  productName: string;
  priceId: string;
  amount: number;
  currency: string;
  interval: string;
  intervalCount: number;
  formattedPrice: string;
}

export const useStripePrices = () => {
  const [prices, setPrices] = useState<StripePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        console.log("Fetching Stripe prices...");
        const { data, error } = await supabase.functions.invoke('get-stripe-prices');
        
        console.log("Stripe prices response:", { data, error });
        
        if (error) {
          console.error('Error response:', error);
          throw error;
        }
        
        if (data && data.prices) {
          setPrices(data.prices);
          console.log("Prices set:", data.prices);
        } else {
          console.warn("No prices in response");
          setPrices([]);
        }
      } catch (err: any) {
        console.error('Error fetching Stripe prices:', err);
        setError(err.message || 'Erro ao buscar preços');
        setPrices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, []);

  const getPriceByProduct = (productId: string) => {
    return prices.find(price => price.productId === productId);
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase() === 'BRL' ? 'BRL' : 'USD',
    }).format(amount / 100);
  };

  return {
    prices,
    loading,
    error,
    getPriceByProduct,
    formatPrice
  };
};