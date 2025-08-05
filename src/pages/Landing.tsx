import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Star, 
  Users, 
  ShoppingCart, 
  TrendingUp,
  Clock,
  Shield,
  HeadphonesIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Básico",
    price: "R$ 29,90",
    period: "/mês",
    description: "Ideal para começar seu delivery",
    features: [
      "Até 50 pedidos por mês",
      "Cardápio básico",
      "Notificações em tempo real",
      "Painel de controle",
      "Suporte por email"
    ],
    popular: false,
    color: "border-gray-200"
  },
  {
    name: "Profissional",
    price: "R$ 59,90",
    period: "/mês",
    description: "Para negócios em crescimento",
    features: [
      "Pedidos ilimitados",
      "Cardápio completo com categorias",
      "Relatórios avançados",
      "Customização de cores",
      "Suporte prioritário",
      "Integração WhatsApp"
    ],
    popular: true,
    color: "border-primary"
  },
  {
    name: "Enterprise",
    price: "R$ 99,90",
    period: "/mês",
    description: "Para grandes operações",
    features: [
      "Tudo do Profissional",
      "Múltiplas lojas",
      "API personalizada",
      "Suporte 24/7",
      "Treinamento personalizado",
      "Relatórios personalizados"
    ],
    popular: false,
    color: "border-amber-400"
  }
];

const features = [
  {
    icon: ShoppingCart,
    title: "Pedidos Online",
    description: "Receba pedidos direto do seu cardápio online personalizado"
  },
  {
    icon: Clock,
    title: "Tempo Real",
    description: "Notificações instantâneas para cada novo pedido"
  },
  {
    icon: TrendingUp,
    title: "Relatórios",
    description: "Acompanhe o crescimento do seu negócio com dados precisos"
  },
  {
    icon: Shield,
    title: "Segurança",
    description: "Seus dados e dos seus clientes protegidos com tecnologia avançada"
  }
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">DeliveryFácil</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Entrar
            </Button>
            <Button onClick={() => navigate('/auth')}>
              Começar Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            ✨ Plataforma completa de delivery
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Transforme seu negócio com
            <span className="text-primary block">DeliveryFácil</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A plataforma mais simples e completa para gerenciar seu delivery. 
            Cardápio online, pedidos em tempo real e muito mais.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" onClick={() => navigate('/auth')}>
              Começar Agora - Grátis
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tudo que você precisa para seu delivery
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Escolha o plano ideal para seu negócio
            </h2>
            <p className="text-xl text-muted-foreground">
              Comece grátis e faça upgrade quando quiser
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.color} ${plan.popular ? 'border-2' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                    <Star className="h-3 w-3 mr-1" />
                    Mais Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => navigate('/auth')}
                  >
                    Começar com {plan.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">
            Mais de 1.000 negócios confiam na DeliveryFácil
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold">1.000+</h3>
              <p className="text-muted-foreground">Restaurantes ativos</p>
            </div>
            <div className="flex flex-col items-center">
              <ShoppingCart className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold">50.000+</h3>
              <p className="text-muted-foreground">Pedidos processados</p>
            </div>
            <div className="flex flex-col items-center">
              <HeadphonesIcon className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold">99%</h3>
              <p className="text-muted-foreground">Satisfação dos clientes</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Crie sua conta grátis e comece a receber pedidos online hoje mesmo.
          </p>
          <Button size="lg" className="text-lg px-8" onClick={() => navigate('/auth')}>
            Criar Conta Grátis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">DeliveryFácil</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 DeliveryFácil. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}