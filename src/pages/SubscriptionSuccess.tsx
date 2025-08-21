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
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

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
        if (data.isNewUser && data.email) {
          console.log('New user created, password sent to email:', data.email);
          setEmailSent(true);
          setUserEmail(data.email);
          setProcessing(false);
          return; // Stay on this page to show the success message
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

  if (emailSent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-green-600">
              ✅ Conta criada com sucesso!
            </CardTitle>
            <CardDescription>
              Sua assinatura foi ativada e suas credenciais foram enviadas por email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 mb-2">
                📧 Verifique seu email: <strong>{userEmail}</strong>
              </p>
              <p className="text-sm text-blue-600">
                Você recebeu suas credenciais de acesso por email. Use-as para fazer seu primeiro login.
              </p>
            </div>
            
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full"
              size="lg"
            >
              Fazer Login
            </Button>
            
            <p className="text-xs text-gray-500">
              Após o login, você poderá alterar sua senha nas configurações da conta.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
