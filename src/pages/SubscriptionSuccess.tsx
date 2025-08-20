import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';

export default function SubscriptionSuccess() {
  const { checkSubscription, loading } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processCheckout = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        toast({
          title: "Erro",
          description: "ID da sessão não encontrado",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      try {
        setProcessing(true);

        // Process the checkout success (for guest users, this will create account)
        const { data, error } = await supabase.functions.invoke('process-checkout-success', {
          body: { sessionId }
        });

        if (error) {
          throw new Error(error.message);
        }

        // If auth token was provided (guest checkout), auto-login the user
        if (data.auth?.token && !user && data.email) {
          const { error: authError } = await supabase.auth.verifyOtp({
            token: data.auth.token,
            type: 'magiclink',
            email: data.email
          });

          if (authError) {
            console.error('Auto-login failed:', authError);
            toast({
              title: "Conta criada!",
              description: `Sua assinatura foi ativada para ${data.email}. Faça login para continuar.`,
            });
          } else {
            toast({
              title: "Bem-vindo!",
              description: "Sua conta foi criada e assinatura ativada com sucesso!",
            });
          }
        } else {
          toast({
            title: "Assinatura ativada!",
            description: "Sua assinatura foi processada com sucesso.",
          });
        }

        // Check subscription status
        await checkSubscription();
        
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);

      } catch (error: any) {
        console.error('Error processing checkout:', error);
        toast({
          title: "Erro ao processar pagamento",
          description: error.message || "Tente novamente em alguns instantes",
          variant: "destructive"
        });
        navigate('/');
      } finally {
        setProcessing(false);
      }
    };

    processCheckout();
  }, [searchParams, checkSubscription, navigate, toast, user]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <CardTitle>
            {processing ? "Processando pagamento..." : "Pagamento confirmado!"}
          </CardTitle>
          <CardDescription>
            {processing 
              ? "Estamos processando seu pagamento e ativando sua assinatura."
              : "Sua assinatura foi ativada com sucesso. Redirecionando..."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(processing || loading) ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <Button onClick={() => navigate('/')}>
              Ir para o Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
