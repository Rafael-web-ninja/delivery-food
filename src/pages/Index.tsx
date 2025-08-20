import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ArrowRight, ShoppingCart, BarChart3, Users, Clock, Star } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useStripePrices } from '@/hooks/useStripePrices';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createCheckout } = useSubscription();
  const { prices, loading: pricesLoading } = useStripePrices();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const features = [
    {
      icon: ShoppingCart,
      title: "Cardápio Digital Completo",
      description: "Crie e gerencie seu cardápio online com fotos, descrições e preços atualizados em tempo real."
    },
    {
      icon: BarChart3,
      title: "Analytics Avançados",
      description: "Acompanhe vendas, produtos mais pedidos e performance do seu delivery em tempo real."
    },
    {
      icon: Users,
      title: "Gestão de Pedidos",
      description: "Sistema completo para receber, processar e acompanhar todos os pedidos do seu delivery."
    },
    {
      icon: Clock,
      title: "Horário de Funcionamento",
      description: "Configure automaticamente os horários de funcionamento e períodos de pausa."
    }
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      business: "Pizzaria Bella Vista",
      content: "Triplicamos nossas vendas online em apenas 2 meses. O sistema é incrível!",
      rating: 5
    },
    {
      name: "João Santos",
      business: "Hambúrgueria do João",
      content: "Finalmente um sistema que funciona de verdade. Recomendo para todos os donos de delivery.",
      rating: 5
    },
    {
      name: "Ana Costa",
      business: "Sushi Express",
      content: "A gestão de pedidos ficou muito mais fácil. Nossos clientes adoraram o novo cardápio digital.",
      rating: 5
    }
  ];

  const handleSubscription = async (planType: 'monthly' | 'annual') => {
    try {
      await createCheckout(planType);
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
    }
  };

  const monthlyPrice = prices.find(p => p.interval === 'month');
  const yearlyPrice = prices.find(p => p.interval === 'year');

  const getYearlyDiscount = () => {
    if (!monthlyPrice || !yearlyPrice) return 0;
    const monthlyYearly = (monthlyPrice.amount * 12);
    const discount = Math.round((1 - (yearlyPrice.amount / monthlyYearly)) * 100);
    return discount;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/dfb072c7-087e-48ca-88a3-40430f88a2d4.png" 
              alt="Gera Cardápio" 
              className="h-8 w-8"
            />
            <span className="text-xl font-bold">Gera Cardápio</span>
          </div>
          <Button onClick={() => navigate('/auth')} variant="outline">
            Login / Cadastro
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4">
        <div className="container text-center">
          <Badge variant="secondary" className="mb-6">
            🚀 A revolução do delivery chegou
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Transforme seu delivery em uma
            <span className="gradient-primary bg-clip-text text-transparent"> máquina de vendas</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Sistema completo de gestão para delivery com cardápio digital, controle de pedidos e analytics poderosos. 
            Tudo que você precisa para aumentar suas vendas em uma única plataforma.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" onClick={() => navigate('/auth')}>
              Começar Agora <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8">
              Ver Demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que seu delivery precisa
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Recursos desenvolvidos especificamente para aumentar suas vendas e facilitar sua gestão
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-medium transition-all">
                <CardHeader>
                  <feature.icon className="h-12 w-12 mx-auto text-primary mb-4" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Escolha o plano ideal para seu negócio
            </h2>
            <p className="text-xl text-muted-foreground">
              Preços justos e transparentes. Sem taxas ocultas.
            </p>
          </div>
          
          {pricesLoading ? (
            <div className="text-center">
              <div className="animate-shimmer h-64 w-full max-w-2xl mx-auto rounded-lg"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Plano Mensal */}
              <Card className="relative hover:shadow-strong transition-all">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Plano Mensal</CardTitle>
                  <CardDescription>Para quem quer testar nossa plataforma</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      {monthlyPrice ? monthlyPrice.formattedPrice : 'R$ 49,90'}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-success" />
                      <span>Cardápio digital ilimitado</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-success" />
                      <span>Gestão completa de pedidos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-success" />
                      <span>Analytics básicos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-success" />
                      <span>Suporte por email</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => handleSubscription('monthly')}
                  >
                    Assinar Plano Mensal
                  </Button>
                </CardFooter>
              </Card>

              {/* Plano Anual */}
              <Card className="relative hover:shadow-strong transition-all border-primary">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="gradient-primary text-primary-foreground">
                    {getYearlyDiscount()}% OFF
                  </Badge>
                </div>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Plano Anual</CardTitle>
                  <CardDescription>Melhor custo-benefício para seu negócio</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      {yearlyPrice ? yearlyPrice.formattedPrice : 'R$ 399,90'}
                    </span>
                    <span className="text-muted-foreground">/ano</span>
                  </div>
                  {monthlyPrice && yearlyPrice && (
                    <p className="text-sm text-muted-foreground">
                      Equivale a {(yearlyPrice.amount / 12 / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-success" />
                      <span>Cardápio digital ilimitado</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-success" />
                      <span>Gestão completa de pedidos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-success" />
                      <span>Analytics avançados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-success" />
                      <span>Suporte prioritário</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-success" />
                      <span>Relatórios personalizados</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full gradient-primary" 
                    onClick={() => handleSubscription('annual')}
                  >
                    Assinar Plano Anual
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-xl text-muted-foreground">
              Mais de 1.000 estabelecimentos já transformaram seus deliveries
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-medium transition-all">
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-base">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.business}</p>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para revolucionar seu delivery?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de estabelecimentos que já aumentaram suas vendas com o Gera Cardápio
          </p>
          <Button size="lg" className="text-lg px-12 gradient-primary" onClick={() => navigate('/auth')}>
            Começar Gratuitamente
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="/lovable-uploads/dfb072c7-087e-48ca-88a3-40430f88a2d4.png" 
                  alt="Gera Cardápio" 
                  className="h-6 w-6"
                />
                <span className="font-bold">Gera Cardápio</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A plataforma completa para gestão do seu delivery
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Demonstração</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contato</a></li>
                <li><a href="/termos" className="hover:text-primary transition-colors">Termos de Uso</a></li>
                <li><a href="/privacidade" className="hover:text-primary transition-colors">Política de Privacidade</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Carreiras</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Gera Cardápio. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;