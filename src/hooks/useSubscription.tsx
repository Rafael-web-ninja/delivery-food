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
    let localSub: any = null;
    let localError: any = null;
    
    try {
      // First check local database for subscription info
      const localResult = await supabase
        .from('subscriber_plans')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      localSub = localResult.data;
      localError = localResult.error;

      if (localSub && !localError) {
        console.log('[useSubscription] Found local subscription:', localSub);
        
        // Check if subscription is still valid
        const isActive = localSub.subscription_status === 'active' && 
          (!localSub.subscription_end || new Date(localSub.subscription_end) > new Date());
        
        setSubscribed(isActive);
        setPlanType(localSub.plan_type || 'free');
        setSubscriptionStatus(localSub.subscription_status || 'inactive');
        setSubscriptionEnd(localSub.subscription_end);
        
        // If subscription seems active, verify with Stripe too
        if (isActive) {
          console.log('[useSubscription] Local subscription active, verifying with Stripe');
        } else {
          console.log('[useSubscription] Local subscription not active, skipping Stripe check');
          setLoading(false);
          return;
        }
      }

      // Now check with Stripe for the most up-to-date info
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
        // If we have local data and Stripe check fails, use local data
        if (localSub && !localError) {
          console.log('[useSubscription] Using local subscription data due to Stripe error');
          return;
        }
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
      // Set default values on error only if we don't have local data
      if (!localSub || localError) {
        setSubscribed(false);
        setPlanType('free');
        setSubscriptionStatus('inactive');
        setSubscriptionEnd(null);
      }
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const createCheckout = useCallback(async (selectedPlanType: string) => {
    console.log('[useSubscription] Starting checkout for plan:', selectedPlanType);
    setLoading(true);
    
    try {
      // Check if user is logged in
      const session = await supabase.auth.getSession();
      const hasUser = !!session.data.session?.user;
      
      console.log('[useSubscription] Session check:', {
        hasSession: !!session.data.session,
        hasToken: !!session.data.session?.access_token,
        userId: session.data.session?.user?.id,
        allowingGuestCheckout: !hasUser
      });

      // Call create-checkout function with or without authentication
      const requestConfig: any = {
        body: { planType: selectedPlanType, guestCheckout: !hasUser }
      };
      
      if (hasUser && session.data.session?.access_token) {
        requestConfig.headers = {
          Authorization: `Bearer ${session.data.session.access_token}`,
        };
      }

      console.log('[useSubscription] Calling create-checkout function');
      const { data, error } = await supabase.functions.invoke('create-checkout', requestConfig);

      if (error) {
        console.error('[useSubscription] Supabase function error:', error);
        throw new Error(error.message || "Erro na função de checkout");
      }

      console.log('[useSubscription] Checkout response:', data);
      
      if (!data?.url) {
        throw new Error("URL de checkout não recebida");
      }

      // Open Stripe checkout in a new tab
      console.log('[useSubscription] Opening checkout URL:', data.url);
      window.open(data.url, '_blank');
      
      toast({
        title: "Redirecionando...",
        description: "Você será redirecionado para o checkout do Stripe",
      });
      
    } catch (error: any) {
      console.error('[useSubscription] Error creating checkout:', error);
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

  // Check if user is business owner
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

  // Check subscription for business owners
  useEffect(() => {
    if (user && isBusinessOwner === true) {
      console.log('[useSubscription] Triggering checkSubscription for business owner');
      checkSubscription();
    } else if (isBusinessOwner === false) {
      // Only reset if we're sure user is not a business owner
      console.log('[useSubscription] User is not business owner, resetting subscription state');
      setSubscribed(false);
      setPlanType('free');
      setSubscriptionStatus('inactive');
      setSubscriptionEnd(null);
    }
    // If isBusinessOwner is null, we're still loading, so don't reset
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