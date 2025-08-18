import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUBSCRIPTION] ${step}${detailsStr}`);
};

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

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || "Erro na função de verificação");
      }

      setSubscribed(data.subscribed || false);
      setPlanType(data.subscription_tier || data.plan_type || 'free');
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
      logStep("Getting auth session");
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      logStep("Invoking customer-portal function");
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error) {
        logStep("Error from customer-portal function", { errorMessage: error.message, status: (error as any)?.context?.response?.status });
        const serverMessage = (data as any)?.error;
        throw new Error(serverMessage || error.message || "Erro ao abrir o portal");
      }

      if (!data?.url) {
        throw new Error("URL do portal não retornada");
      }

      logStep("Opening customer portal", { url: data.url });
      // Open customer portal in a new tab
      window.open(data.url, '_blank');
      
      toast({
        title: "Portal aberto",
        description: "O portal de gerenciamento foi aberto em uma nova aba",
      });
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      const errorMessage = error.message || "Tente novamente em alguns instantes";
      
      toast({
        title: "Erro ao abrir portal",
        description: errorMessage.includes("configurado no Stripe") 
          ? "O portal de pagamentos precisa ser configurado. Entre em contato com o suporte."
          : errorMessage,
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