import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function SubscriptionSuccess() {
  const { checkSubscription, loading } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      await checkSubscription();
      // Pequeno atraso para garantir atualização e então redirecionar
      setTimeout(() => navigate('/subscription', { replace: true }), 1200);
    };
    run();
  }, [checkSubscription, navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <CardTitle>Pagamento confirmado</CardTitle>
          <CardDescription>
            Estamos ativando sua assinatura. Você será redirecionado em instantes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6"><LoadingSpinner size="lg" /></div>
          ) : (
            <Button onClick={() => navigate('/subscription')}>Ir para Assinaturas</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
