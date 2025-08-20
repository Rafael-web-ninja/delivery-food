import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, BarChart3, Users, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Demo = () => {
  const navigate = useNavigate();

  const demoSteps = [
    {
      icon: ShoppingCart,
      title: "Criação do Cardápio",
      description: "Adicione produtos, fotos, descrições e preços de forma intuitiva",
      image: "/lovable-uploads/dfb072c7-087e-48ca-88a3-40430f88a2d4.png"
    },
    {
      icon: Users,
      title: "Recebimento de Pedidos",
      description: "Visualize pedidos em tempo real com todas as informações necessárias",
      image: "/lovable-uploads/e3282e15-f7f7-4c67-8089-4b56167f770b.png"
    },
    {
      icon: BarChart3,
      title: "Analytics Detalhados",
      description: "Acompanhe vendas, produtos mais pedidos e performance completa",
      image: "/lovable-uploads/dfb072c7-087e-48ca-88a3-40430f88a2d4.png"
    },
    {
      icon: Clock,
      title: "Gestão Automática",
      description: "Configure horários, status do delivery e muito mais automaticamente",
      image: "/lovable-uploads/e3282e15-f7f7-4c67-8089-4b56167f770b.png"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/lovable-uploads/dfb072c7-087e-48ca-88a3-40430f88a2d4.png" alt="Gera Cardápio" className="h-8 w-8" />
            <span className="text-xl font-bold">Gera Cardápio</span>
          </div>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </header>

      {/* Demo Hero */}
      <section className="py-16 px-4">
        <div className="container text-center">
          <Badge variant="secondary" className="mb-6">
            🎯 Demonstração Interativa
          </Badge>
          <h1 className="text-4xl font-bold mb-6 md:text-6xl">
            Veja o <span className="gradient-primary bg-clip-text text-transparent">Gera Cardápio</span> em ação
          </h1>
          <p className="text-muted-foreground mb-8 max-w-3xl mx-auto text-lg">
            Descubra como nosso sistema pode transformar seu delivery em apenas alguns cliques
          </p>
        </div>
      </section>

      {/* Demo Steps */}
      <section className="py-12">
        <div className="container">
          <div className="grid gap-12">
            {demoSteps.map((step, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-medium transition-all">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                        <step.icon className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="outline">Passo {index + 1}</Badge>
                    </div>
                    <CardHeader className="p-0">
                      <CardTitle className="text-2xl mb-2">{step.title}</CardTitle>
                      <CardDescription className="text-base">{step.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 mt-6">
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Configuração em menos de 5 minutos</span>
                      </div>
                    </CardContent>
                  </div>
                  <div className="bg-muted/30 p-8 flex items-center justify-center">
                    <div className="w-full max-w-md h-64 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                      <img 
                        src={step.image} 
                        alt={step.title}
                        className="w-24 h-24 opacity-60"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Crie sua conta gratuita e transforme seu delivery hoje mesmo
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 gradient-primary" onClick={() => navigate('/auth')}>
              Começar Agora Grátis
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8" onClick={() => navigate('/')}>
              Ver Preços
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t py-8">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/lovable-uploads/dfb072c7-087e-48ca-88a3-40430f88a2d4.png" alt="Gera Cardápio" className="h-6 w-6" />
            <span className="font-bold">Gera Cardápio</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; 2024 Gera Cardápio. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Demo;