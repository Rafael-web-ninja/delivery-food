import { useEffect, useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useStripePrices } from '@/hooks/useStripePrices';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Crown, CreditCard, Calendar, RefreshCw, ExternalLink } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency } from '@/lib/formatters';
import { supabase } from '@/integrations/supabase/client';

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
  
  const { prices, loading: pricesLoading, getPriceByProduct, formatPrice } = useStripePrices();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!subscribed) return;
      setInvoicesLoading(true);
      setInvoicesError(null);
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        const { data, error } = await supabase.functions.invoke('list-invoices', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (error) throw new Error(error.message || 'Erro ao carregar faturas');
        setInvoices(data.invoices || []);
      } catch (e: any) {
        setInvoicesError(e.message || 'Erro ao carregar faturas');
        setInvoices([]);
      } finally {
        setInvoicesLoading(false);
      }
    };
    fetchInvoices();
  }, [subscribed]);

  const planDetails = {
    free: { name: 'Gratuito', price: 0, color: 'bg-gray-500' },
    mensal: { 
      name: 'Mensal', 
      price: getPriceByProduct("prod_SrUoyAbRcb6Qg8")?.amount || 0, 
      color: 'bg-blue-500' 
    },
    anual: { 
      name: 'Anual', 
      price: getPriceByProduct("prod_SrUpK1iT4fKXq7")?.amount || 0, 
      color: 'bg-purple-500' 
    }
  };

  const currentPlan = planDetails[planType as keyof typeof planDetails] || planDetails.free;

  if (loading || pricesLoading) {
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
                {currentPlan.price === 0 ? 'Grátis' : formatPrice(currentPlan.price, 'BRL')}
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
            {planType === 'free' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => createCheckout('mensal')}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  Assinar Plano Mensal
                </Button>
                <Button
                  onClick={() => createCheckout('anual')}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  Assinar Plano Anual
                </Button>
              </>
            )}
            {subscribed && (
              <Button
                variant="outline"
                onClick={openCustomerPortal}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Gerenciar Assinatura
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold text-lg">Plano Mensal</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPrice(getPriceByProduct("prod_SrUoyAbRcb6Qg8")?.amount || 0, "BRL")}
                </p>
              </div>
              <ul className="space-y-2 text-sm">
                <li>✓ Itens ilimitados no cardápio</li>
                <li>✓ Deliveries ilimitados</li>
                <li>✓ Relatórios avançados</li>
                <li>✓ PDV integrado</li>
                <li>✓ Suporte por email</li>
              </ul>
              {planType !== 'mensal' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createCheckout('mensal')}
                  disabled={loading}
                  className="w-full"
                >
                  Assinar Plano Mensal
                </Button>
              )}
            </div>

            <div className="space-y-4 border-2 border-primary rounded-lg p-4 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                Mais Popular
              </Badge>
              <div className="text-center">
                <h3 className="font-semibold text-lg">Plano Anual</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {formatPrice(getPriceByProduct("prod_SrUpK1iT4fKXq7")?.amount || 0, "BRL")}
                </p>
              </div>
              <ul className="space-y-2 text-sm">
                <li>✓ Tudo do Plano Mensal</li>
                <li>✓ Desconto especial</li>
                <li>✓ Recursos premium</li>
                <li>✓ API personalizada</li>
                <li>✓ Suporte dedicado</li>
              </ul>
              {planType !== 'anual' && (
                <Button
                  size="sm"
                  onClick={() => createCheckout('anual')}
                  disabled={loading}
                  className="w-full"
                >
                  Assinar Plano Anual
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
              Veja abaixo suas últimas faturas. Para mais detalhes, acesse o portal do cliente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoicesLoading ? (
              <div className="flex justify-center py-4"><LoadingSpinner size="sm" /></div>
            ) : invoicesError ? (
              <p className="text-sm text-destructive">{invoicesError}</p>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem cobranças encontradas.</p>
            ) : (
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {inv.created ? new Date(inv.created).toLocaleDateString('pt-BR') : '--/--/----'}
                      </span>
                      <span className="capitalize">{inv.status === 'paid' ? 'Pago' : inv.status}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatPrice(inv.amount_paid || inv.amount_due || 0, 'BRL')}</span>
                      {inv.hosted_invoice_url && (
                        <a className="underline text-primary" href={inv.hosted_invoice_url} target="_blank" rel="noreferrer">
                          Ver fatura
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </CardContent>
        </Card>
      )}

    </div>
  );
}