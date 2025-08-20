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
    if (!user) {
      console.log("No user, skipping subscription check");
      return;
    }
    
    setLoading(true);
    try {
      // Get fresh session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session.session?.access_token) {
        console.warn("Session error:", sessionError?.message || "No session");
        setSubscribed(false);
        setPlanType('free');
        setSubscriptionStatus('inactive');
        setSubscriptionEnd(null);
        return;
      }

      console.log("Calling check-subscription function...");
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log("Function response:", { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || "Erro na função de verificação");
      }

      // Always use the response data, even if there's an error field
      const responseData = data || {};
      
      setSubscribed(responseData.subscribed || false);
      setPlanType(responseData.subscription_tier || responseData.plan_type || 'free');
      setSubscriptionStatus(responseData.subscription_status || 'inactive');
      setSubscriptionEnd(responseData.subscription_end || null);
      
      console.log("Subscription data set:", {
        subscribed: responseData.subscribed || false,
        planType: responseData.subscription_tier || responseData.plan_type || 'free',
        subscriptionStatus: responseData.subscription_status || 'inactive',
        subscriptionEnd: responseData.subscription_end || null
      });
      
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      
      // Set default values on error
      setSubscribed(false);
      setPlanType('free');
      setSubscriptionStatus('inactive');
      setSubscriptionEnd(null);
      
      // Only show toast for unexpected errors
      if (!error.message?.includes('Session') && !error.message?.includes('authentication')) {
        toast({
          title: "Erro ao verificar assinatura",
          description: error.message || "Tente novamente em alguns instantes",
          variant: "destructive"
        });
      }
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
          'Content-Type': 'application/json',
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
          'Content-Type': 'application/json',
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

  // Check if user is business owner
  useEffect(() => {
    const checkUserType = async () => {
      if (!user) {
        setIsBusinessOwner(null);
        return;
      }

      try {
        const { data: business } = await supabase
          .from('delivery_businesses')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        setIsBusinessOwner(!!business);
      } catch (error) {
        setIsBusinessOwner(false);
      }
    };

    checkUserType();
  }, [user]);

  // Check subscription only for business owners
  useEffect(() => {
    if (user && isBusinessOwner === true) {
      checkSubscription();
    } else {
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