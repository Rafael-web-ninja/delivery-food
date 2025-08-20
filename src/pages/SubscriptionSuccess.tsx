import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSubscription, loading } = useSubscription();
  const { toast } = useToast();
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Refresh subscription status after successful payment
    const updateSubscription = async () => {
      await checkSubscription();
      toast({
        title: "Assinatura ativada!",
        description: "Sua assinatura foi processada com sucesso.",
        variant: "default"
      });
    };

    if (sessionId) {
      // Wait a bit for Stripe to process
      setTimeout(updateSubscription, 2000);
    }
  }, [sessionId, checkSubscription, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Pagamento Confirmado!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {loading ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner size="lg" />
              <span className="ml-2">Ativando assinatura...</span>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">
                Sua assinatura foi processada com sucesso. Você já pode começar a usar todos os recursos disponíveis.
              </p>
              
              {sessionId && (
                <p className="text-xs text-muted-foreground">
                  ID da sessão: {sessionId}
                </p>
              )}
              
              <div className="space-y-2 pt-4">
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  className="w-full"
                >
                  Ir para Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/subscription')}
                  className="w-full"
                >
                  Ver Assinatura
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
