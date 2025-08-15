import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Crown, CreditCard, Calendar, RefreshCw, ExternalLink } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency } from '@/lib/formatters';

const planDetails = {
  free: { name: 'Gratuito', price: 0, color: 'bg-gray-500' },
  basic: { name: 'Básico', price: 2990, color: 'bg-blue-500' },
  premium: { name: 'Premium', price: 4990, color: 'bg-purple-500' },
  enterprise: { name: 'Enterprise', price: 9990, color: 'bg-gold-500' }
};

export default function SubscriptionManagement() {
  const { 
    subscribed, 
    planType, 
    subscriptionStatus, 
    subscriptionEnd, 
    loading, 
    checkSubscription, 
    createCheckout, 
    openCustomerPortal 
  } = useSubscription();

  const currentPlan = planDetails[planType as keyof typeof planDetails] || planDetails.free;

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Assinatura</h1>
          <p className="text-muted-foreground">
            Gerencie sua assinatura e método de pagamento
          </p>
        </div>
        <Button
          variant="outline"
          onClick={checkSubscription}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Status
        </Button>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${currentPlan.color}`} />
              <div>
                <CardTitle className="flex items-center gap-2">
                  Plano {currentPlan.name}
                  {planType !== 'free' && <Crown className="w-4 h-4 text-yellow-500" />}
                </CardTitle>
                <CardDescription>
                  {subscribed ? 'Assinatura ativa' : 'Sem assinatura ativa'}
                </CardDescription>
              </div>
            </div>
            <Badge variant={subscribed ? 'default' : 'secondary'}>
              {subscriptionStatus === 'active' ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Mensal</p>
              <p className="text-2xl font-bold">
                {currentPlan.price === 0 ? 'Grátis' : formatCurrency(currentPlan.price)}
              </p>
            </div>
            {subscriptionEnd && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Próxima Cobrança</p>
                <p className="text-lg font-semibold">
                  {new Date(subscriptionEnd).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-lg font-semibold capitalize">
                {subscriptionStatus === 'active' ? 'Ativa' : 'Inativa'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-3">
            {subscribed && (
              <Button
                onClick={openCustomerPortal}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Gerenciar Pagamento
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
            
            {planType !== 'enterprise' && (
              <Button
                variant="outline"
                onClick={() => createCheckout(planType === 'free' ? 'basic' : planType === 'basic' ? 'premium' : 'enterprise')}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Crown className="w-4 h-4" />
                {planType === 'free' ? 'Assinar Plano Básico' : 'Fazer Upgrade'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Comparar Planos</CardTitle>
          <CardDescription>
            Veja os recursos disponíveis em cada plano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold text-lg">Básico</h3>
                <p className="text-2xl font-bold text-blue-600">R$ 29,90/mês</p>
              </div>
              <ul className="space-y-2 text-sm">
                <li>✓ Até 50 itens no cardápio</li>
                <li>✓ 1 delivery cadastrado</li>
                <li>✓ Pedidos online</li>
                <li>✓ Suporte por email</li>
              </ul>
              {planType !== 'basic' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createCheckout('basic')}
                  disabled={loading}
                  className="w-full"
                >
                  {planType === 'free' ? 'Assinar' : 'Mudar para Básico'}
                </Button>
              )}
            </div>

            <div className="space-y-4 border-2 border-primary rounded-lg p-4 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                Mais Popular
              </Badge>
              <div className="text-center">
                <h3 className="font-semibold text-lg">Premium</h3>
                <p className="text-2xl font-bold text-purple-600">R$ 49,90/mês</p>
              </div>
              <ul className="space-y-2 text-sm">
                <li>✓ Itens ilimitados no cardápio</li>
                <li>✓ Até 3 deliveries</li>
                <li>✓ Relatórios avançados</li>
                <li>✓ PDV integrado</li>
                <li>✓ Suporte prioritário</li>
              </ul>
              {planType !== 'premium' && (
                <Button
                  size="sm"
                  onClick={() => createCheckout('premium')}
                  disabled={loading}
                  className="w-full"
                >
                  {planType === 'free' ? 'Assinar' : planType === 'basic' ? 'Fazer Upgrade' : 'Mudar para Premium'}
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold text-lg">Enterprise</h3>
                <p className="text-2xl font-bold text-gold-600">R$ 99,90/mês</p>
              </div>
              <ul className="space-y-2 text-sm">
                <li>✓ Tudo do Premium</li>
                <li>✓ Deliveries ilimitados</li>
                <li>✓ API personalizada</li>
                <li>✓ Integração com sistemas</li>
                <li>✓ Suporte dedicado</li>
              </ul>
              {planType !== 'enterprise' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createCheckout('enterprise')}
                  disabled={loading}
                  className="w-full"
                >
                  {planType === 'free' ? 'Assinar' : 'Fazer Upgrade'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      {subscribed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Histórico de Cobrança
            </CardTitle>
            <CardDescription>
              Acesse seu histórico completo de cobranças através do portal do cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={openCustomerPortal}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Ver Histórico Completo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}