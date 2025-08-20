import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionContextType {
  subscribed: boolean;
  planType: string;
  subscriptionStatus: string;
  subscriptionEnd: string | null;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  createCheckout: (planType: string) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscribed, setSubscribed] = useState(false);
  const [planType, setPlanType] = useState('free');
  const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isBusinessOwner, setIsBusinessOwner] = useState<boolean | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session?.access_token) {
        throw new Error("Usuário não autenticado");
      }

      console.log('[useSubscription] Calling check-subscription function');
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || "Erro na função de verificação");
      }

      console.log('[useSubscription] Response from check-subscription:', data);
      
      setSubscribed(data.subscribed || false);
      setPlanType(data.plan_type || 'free');
      setSubscriptionStatus(data.subscription_status || 'inactive');
      setSubscriptionEnd(data.subscription_end || null);
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      // Falhar silenciosamente se for erro de auth, mostrar toast apenas para outros erros
      if (!error.message?.includes('autenticado') && !error.message?.includes('Session')) {
        toast({
          title: "Erro ao verificar assinatura",
          description: error.message || "Tente novamente em alguns instantes",
          variant: "destructive"
        });
      }
      // Set default values on error
      setSubscribed(false);
      setPlanType('free');
      setSubscriptionStatus('inactive');
      setSubscriptionEnd(null);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const createCheckout = useCallback(async (selectedPlanType: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session?.access_token) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType: selectedPlanType },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || "Erro na função de checkout");
      }

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erro ao criar checkout",
        description: error.message || "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const openCustomerPortal = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      // Open customer portal in a new tab
      window.open(data.url, '_blank');
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Erro ao abrir portal",
        description: error.message || "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Check if user is business owner - more robust
  useEffect(() => {
    const checkUserType = async () => {
      if (!user) {
        setIsBusinessOwner(null);
        return;
      }

      try {
        // Use database function for reliable owner check
        const { data: businessId, error } = await supabase.rpc('get_user_business_id');
        
        if (error) {
          console.error('Error checking business owner:', error);
          setIsBusinessOwner(false);
          return;
        }

        setIsBusinessOwner(!!businessId);
        console.log('[useSubscription] Business owner check:', { businessId, isOwner: !!businessId });
      } catch (error) {
        console.error('Error in business owner check:', error);
        setIsBusinessOwner(false);
      }
    };

    checkUserType();
  }, [user]);

  // Check subscription only for business owners - prevent state reset during loading
  useEffect(() => {
    if (isBusinessOwner === null) {
      // Still determining if user is business owner, don't reset state
      return;
    }
    
    if (user && isBusinessOwner === true) {
      console.log('[useSubscription] Triggering checkSubscription for business owner');
      checkSubscription();
    } else {
      // Only reset if we're sure user is not a business owner
      console.log('[useSubscription] User is not business owner, resetting subscription state');
      setSubscribed(false);
      setPlanType('free');
      setSubscriptionStatus('inactive');
      setSubscriptionEnd(null);
    }
  }, [user, isBusinessOwner, checkSubscription]);

  const contextValue = {
    subscribed,
    planType,
    subscriptionStatus,
    subscriptionEnd,
    loading,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};