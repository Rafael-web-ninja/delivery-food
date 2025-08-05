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
    price: "29",
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
    price: "59",
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
    price: "99",
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
    icon: "🚀",
    title: "Setup Rápido",
    description: "Configure seu delivery em menos de 5 minutos e comece a vender imediatamente"
  },
  {
    icon: "📱",
    title: "App Responsivo",
    description: "Cardápio online perfeito em qualquer dispositivo - mobile, tablet ou desktop"
  },
  {
    icon: "⚡",
    title: "Notificações Instantâneas",
    description: "Receba alertas em tempo real sobre novos pedidos e atualizações"
  },
  {
    icon: "📊",
    title: "Analytics Avançado",
    description: "Relatórios completos para acompanhar vendas, produtos mais pedidos e crescimento"
  },
  {
    icon: "💳",
    title: "Pagamentos Seguros",
    description: "Aceite PIX, cartão de crédito e débito com total segurança"
  },
  {
    icon: "🎨",
    title: "Personalização Total",
    description: "Customize cores, logo e layout para combinar com sua marca"
  }
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
                DeliveryFácil
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-pink-500 transition-colors">
                Recursos
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-pink-500 transition-colors">
                Preços
              </a>
              <a href="#contact" className="text-gray-600 hover:text-pink-500 transition-colors">
                Contato
              </a>
              <Button 
                onClick={() => navigate("/auth")}
                className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
              >
                Entrar
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-soft"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-300/10 rounded-full blur-3xl animate-pulse-soft"></div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 pt-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-8rem)]">
            <div className="text-white">
              <h1 className="text-6xl lg:text-7xl font-bold leading-tight mb-6">
                Delivery que{" "}
                <span className="text-yellow-300">transforma</span>{" "}
                seu negócio
              </h1>
              <p className="text-xl mb-8 opacity-90 leading-relaxed">
                Conecte seu restaurante a milhares de clientes. 
                Sistema completo de delivery com gestão inteligente e interface moderna.
              </p>
              
              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button 
                  size="lg"
                  className="bg-white text-red-500 px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-105 transform transition-all duration-300"
                  onClick={() => navigate("/auth")}
                >
                  🍔 Sou Cliente
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  className="border-2 border-white text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white hover:text-red-500 transition-all duration-300"
                  onClick={() => navigate("/auth")}
                >
                  🏪 Tenho um Delivery
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 opacity-90">
                <div className="text-center">
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-sm">Restaurantes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">15k+</div>
                  <div className="text-sm">Pedidos/mês</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">98%</div>
                  <div className="text-sm">Satisfação</div>
                </div>
              </div>
            </div>
            
            {/* Hero Image/Animation */}
            <div className="relative lg:block hidden">
              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="bg-white rounded-2xl p-6 shadow-2xl">
                  <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                    <div className="text-gray-500 text-6xl">📱</div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">Como Funciona</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Cadastre seu Delivery", description: "Crie sua conta e configure seu restaurante em minutos", icon: "🏪" },
              { title: "Monte seu Cardápio", description: "Adicione produtos, fotos e preços de forma simples", icon: "📋" },
              { title: "Receba Pedidos", description: "Gerencie tudo em tempo real e aumente suas vendas", icon: "📱" }
            ].map((step, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Recursos que Fazem a Diferença
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tecnologia avançada para impulsionar seu delivery ao próximo nível
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100"
              >
                <div className="text-4xl mb-6">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Planos de Assinatura
            </h2>
            <p className="text-xl text-gray-600">
              Escolha o plano perfeito para o seu delivery crescer
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`bg-white p-8 rounded-3xl shadow-lg relative transform transition-all duration-300 hover:scale-105 ${
                  plan.popular 
                    ? 'ring-4 ring-pink-500 scale-105' 
                    : 'hover:shadow-2xl'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-2 rounded-full text-sm font-bold">
                    🔥 Mais Popular
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent mb-2">
                    R$ {plan.price}
                    <span className="text-lg text-gray-500 font-normal">{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full py-3 text-lg font-bold rounded-2xl transition-all ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white' 
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                  onClick={() => navigate("/auth")}
                >
                  Começar Agora
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              O Que Nossos Clientes Dizem
            </h2>
            <p className="text-xl text-gray-600">
              Histórias reais de sucesso com a DeliveryFácil
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Carlos Silva",
                business: "Pizzaria do Carlos",
                text: "Triplicamos nossas vendas em 3 meses! A plataforma é muito fácil de usar.",
                rating: 5
              },
              {
                name: "Maria Santos",
                business: "Hamburgeria da Maria",
                text: "Gestão completa dos pedidos, desde o pagamento até a entrega. Perfeito!",
                rating: 5
              },
              {
                name: "João Oliveira",
                business: "Sushi Express",
                text: "Suporte excelente e funcionalidades que realmente fazem diferença no dia a dia.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-3xl">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <div className="font-bold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600">{testimonial.business}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-pink-500 to-red-500 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para Revolucionar seu Delivery?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Comece hoje mesmo e veja suas vendas decolarem!
          </p>
          <Button 
            size="lg"
            className="bg-white text-red-500 px-8 py-4 text-lg font-bold rounded-2xl hover:scale-105 transition-transform"
            onClick={() => navigate("/auth")}
          >
            Criar Conta Grátis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">D</span>
                </div>
                <span className="text-xl font-bold">DeliveryFácil</span>
              </div>
              <p className="text-gray-400">
                A plataforma completa para transformar seu delivery
              </p>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Produto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Suporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 DeliveryFácil. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}