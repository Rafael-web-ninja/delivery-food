import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface SubscriptionGateProps {
  children: React.ReactNode;
  requiredPlan?: 'basic' | 'premium' | 'enterprise';
  fallback?: React.ReactNode;
}

const PlanCard = ({ 
  title, 
  price, 
  features, 
  planType, 
  isPopular = false 
}: {
  title: string;
  price: string;
  features: string[];
  planType: string;
  isPopular?: boolean;
}) => {
  const { createCheckout, loading } = useSubscription();

  return (
    <Card className={`relative ${isPopular ? 'border-primary shadow-lg scale-105' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1">
            <Crown className="w-3 h-3 mr-1" />
            Mais Popular
          </Badge>
        </div>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-3xl font-bold text-primary">
          {price}
          {price !== 'Grátis' && <span className="text-sm font-normal text-muted-foreground">/mês</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        <Button 
          className="w-full" 
          variant={isPopular ? "default" : "outline"}
          onClick={() => createCheckout(planType)}
          disabled={loading}
        >
          {loading ? <LoadingSpinner size="sm" /> : "Escolher Plano"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default function SubscriptionGate({ children, requiredPlan = 'basic', fallback }: SubscriptionGateProps) {
  const { subscribed, planType, loading, createCheckout } = useSubscription();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Check if user has required plan level
  const planLevels = { free: 0, basic: 1, premium: 2, enterprise: 3 };
  const userLevel = planLevels[planType as keyof typeof planLevels] || 0;
  const requiredLevel = planLevels[requiredPlan];

  if (subscribed && userLevel >= requiredLevel) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Escolha seu Plano</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Para continuar usando o Gera Cardápio, você precisa de uma assinatura ativa
          </p>
          {!subscribed && (
            <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                <X className="w-5 h-5" />
                <span className="font-medium">Assinatura Necessária</span>
              </div>
              <p className="text-orange-700 dark:text-orange-300 mt-1">
                Você precisa de uma assinatura ativa para acessar esta funcionalidade.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <PlanCard
            title="Básico"
            price="R$ 29,90"
            planType="basic"
            features={[
              "Até 50 itens no cardápio",
              "1 delivery cadastrado",
              "Pedidos online",
              "Suporte por email"
            ]}
          />
          
          <PlanCard
            title="Premium"
            price="R$ 49,90"
            planType="premium"
            isPopular={true}
            features={[
              "Itens ilimitados no cardápio",
              "Até 3 deliveries",
              "Relatórios avançados",
              "PDV integrado",
              "Suporte prioritário"
            ]}
          />
          
          <PlanCard
            title="Enterprise"
            price="R$ 99,90"
            planType="enterprise"
            features={[
              "Tudo do Premium",
              "Deliveries ilimitados",
              "API personalizada",
              "Integração com sistemas",
              "Suporte dedicado"
            ]}
          />
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Todas as assinaturas incluem 7 dias de teste grátis
          </p>
          <p className="text-sm text-muted-foreground">
            Cancele a qualquer momento. Sem contratos ou taxas ocultas.
          </p>
        </div>
      </div>
    </div>
  );
}