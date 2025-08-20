import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function SubscriptionCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-2xl">Pagamento Cancelado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            O processo de pagamento foi cancelado. Nenhuma cobrança foi realizada.
          </p>
          
          <p className="text-sm text-muted-foreground">
            Você pode tentar novamente a qualquer momento ou entrar em contato conosco se precisar de ajuda.
          </p>
          
          <div className="space-y-2 pt-4">
            <Button 
              onClick={() => navigate('/subscription')} 
              className="w-full"
            >
              <RefreshCw className="mr-2 w-4 h-4" />
              Tentar Novamente
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Voltar ao Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}