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
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setProcessing(true);
      try {
        const { data, error } = await supabase.functions.invoke('process-checkout-success', {
          body: { sessionId }
        });

        if (error) throw error;

        if (data?.isNewUser) {
          setEmailSent(true);
          setUserEmail(data.email);
          if (data?.emailSent) {
            toast({
              title: "Conta criada!",
              description: "Credenciais enviadas por email. Verifique sua caixa de entrada.",
            });
          } else {
            toast({
              title: "Conta criada!",
              description: "Sua conta foi criada. Faça login para acessar.",
              variant: "default",
            });
          }
        } else {
          toast({
            title: "Assinatura ativada!",
            description: "Seu pagamento foi processado com sucesso. Faça login para acessar.",
          });
          await checkSubscription();
          setProcessing(false);
          // Don't auto-navigate, let user click login button
        }
      } catch (error: any) {
        console.error('Erro ao processar checkout:', error);
        toast({
          title: "Erro no processamento",
          description: "Houve um problema. Tente novamente em alguns minutos.",
          variant: "destructive",
        });
        // Don't navigate away on error - show login button
        setProcessing(false);
      } finally {
        setProcessing(false);
      }
    };

    processCheckout();
  }, [searchParams, checkSubscription, navigate, toast]);

  // Show success page for all cases (new user or existing user)
  if (!processing && !loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600 text-2xl">
              ✅ Pagamento Confirmado!
            </CardTitle>
            <CardDescription className="text-lg">
              {emailSent && userEmail ? 
                "Sua assinatura foi ativada e suas credenciais foram enviadas por email." :
                "Sua assinatura foi ativada com sucesso!"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="text-green-600 text-6xl mb-4">
              ✅
            </div>
            
            {emailSent && userEmail && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-center text-blue-600 mb-2">
                  ✉️
                </div>
                <p className="text-blue-800 font-medium">
                  Enviamos sua senha temporária para:
                </p>
                <p className="text-blue-600 text-sm">
                  <strong>{userEmail}</strong>
                </p>
                <p className="text-blue-600 text-sm">
                  Verifique sua caixa de entrada e pasta de spam!
                </p>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full"
                size="lg"
              >
                Fazer Login
              </Button>
              {emailSent && (
                <p className="text-xs text-muted-foreground">
                  Lembre-se de alterar sua senha após o primeiro login por segurança
                </p>
              )}
            </div>
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
            <Button onClick={() => navigate('/auth')}>
              Fazer Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
