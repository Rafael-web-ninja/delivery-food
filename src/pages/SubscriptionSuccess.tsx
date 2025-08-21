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
        
        console.log('Calling process-checkout-success with sessionId:', sessionId);

        // Process the checkout success (for guest users, this will create account)
        const { data, error } = await supabase.functions.invoke('process-checkout-success', {
          body: { sessionId }
        });

        console.log('Response from process-checkout-success:', { data, error });

        if (error) {
          console.error('Edge function error:', error);
          throw new Error(error.message);
        }

        // If new user was created (guest checkout), show email sent message
        if (data.auth?.redirectTo && data.email) {
          console.log('New user created, password sent to email:', data.email);
          
          toast({
            title: "Conta criada com sucesso!",
            description: `Sua senha de acesso foi enviada para ${data.email}. Verifique sua caixa de entrada.`,
            duration: 6000,
          });
          
          // Redirect to login after showing the message
          setTimeout(() => {
            navigate('/auth', { replace: true });
          }, 3000);
          
          return;
        }

        toast({
          title: "Assinatura ativada!",
          description: "Sua assinatura foi processada com sucesso.",
        });

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
              ? "Estamos processando seu pagamento e ativando sua assinatura. Suas credenciais de acesso serão enviadas por email."
              : "Sua assinatura foi ativada com sucesso. Verifique seu email para as credenciais de acesso."
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
