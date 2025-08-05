import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Menu, X, Check, Star } from "lucide-react";

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const benefits = [
    { title: "Painel Administrativo", desc: "Gerencie pedidos, produtos e clientes em tempo real" },
    { title: "Pagamentos Integrados", desc: "Receba pagamentos via cartão, PIX e dinheiro" },
    { title: "Relatórios Detalhados", desc: "Acompanhe suas vendas e performance" },
    { title: "App para Clientes", desc: "Seus clientes fazem pedidos pelo app" }
  ];

  const steps = [
    { step: "1", title: "Cadastre-se", desc: "Registre seu delivery em minutos", icon: "📝" },
    { step: "2", title: "Configure", desc: "Adicione produtos e defina preços", icon: "⚙️" },
    { step: "3", title: "Venda", desc: "Receba pedidos e acompanhe vendas", icon: "🚀" }
  ];

  const plans = [
    { 
      name: "Básico", 
      price: "49", 
      features: ["Até 100 pedidos/mês", "1 usuário", "Suporte email"] 
    },
    { 
      name: "Profissional", 
      price: "99", 
      popular: true, 
      features: ["Pedidos ilimitados", "3 usuários", "Suporte prioritário", "Relatórios avançados"] 
    },
    { 
      name: "Enterprise", 
      price: "199", 
      features: ["Tudo do Pro", "Usuários ilimitados", "API personalizada", "Gerente dedicado"] 
    }
  ];

  const testimonials = [
    { name: "João Silva", role: "Proprietário - Pizza Express", text: "Aumentei minhas vendas em 300% em apenas 2 meses!", rating: 5 },
    { name: "Maria Santos", role: "Gerente - Burger House", text: "Sistema perfeito, fácil de usar e clientes adoram!", rating: 5 },
    { name: "Carlos Lima", role: "Chef - Sushi Zen", text: "Controle total dos pedidos, recomendo demais!", rating: 5 }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header Clean */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg"></div>
              <span className="text-xl font-bold text-gray-900">DeliveryApp</span>
            </div>
            
            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#como-funciona" className="text-gray-600 hover:text-gray-900 transition-colors">Como Funciona</a>
              <a href="#precos" className="text-gray-600 hover:text-gray-900 transition-colors">Preços</a>
              <a href="#contato" className="text-gray-600 hover:text-gray-900 transition-colors">Contato</a>
            </nav>
            
            {/* CTAs */}
            <div className="hidden md:flex items-center space-x-3">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                Entrar
              </Button>
              <Button className="bg-blue-500 text-white hover:bg-blue-600">
                Começar
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-100">
              <nav className="flex flex-col space-y-4 mt-4">
                <a href="#como-funciona" className="text-gray-600 hover:text-gray-900">Como Funciona</a>
                <a href="#precos" className="text-gray-600 hover:text-gray-900">Preços</a>
                <a href="#contato" className="text-gray-600 hover:text-gray-900">Contato</a>
                <div className="flex flex-col space-y-2 pt-4">
                  <Button variant="ghost">Entrar</Button>
                  <Button className="bg-blue-500 text-white hover:bg-blue-600">Começar</Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-8">
              ✨ Plataforma de Delivery Completa
            </div>
            
            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Conecte seu delivery com
              <span className="text-blue-500"> milhares de clientes</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
              Sistema completo de gestão para delivery com painel administrativo, 
              controle de pedidos e pagamentos integrados.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button size="lg" className="bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-600 shadow-md">
                Criar Meu Delivery
              </Button>
              <Button variant="outline" size="lg" className="border border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50">
                Ver Demo
              </Button>
            </div>
            
            {/* Preview */}
            <div className="relative max-w-4xl mx-auto">
              <div className="bg-gray-100 rounded-2xl p-4 shadow-lg">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-lg">Dashboard Preview</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Como Funciona</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Em poucos passos, seu delivery está online e recebendo pedidos
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center text-2xl mb-6 mx-auto">
                  {item.icon}
                </div>
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mb-4 mx-auto">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Conteúdo */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Tudo que você precisa em um só lugar
              </h2>
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Placeholder */}
            <div className="bg-gray-100 rounded-2xl p-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">Features Illustration</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">O que nossos clientes dizem</h2>
            <p className="text-lg text-gray-600">Mais de 1000 deliveries confiam em nossa plataforma</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Planos Simples</h2>
            <p className="text-lg text-gray-600">Escolha o plano ideal para seu delivery</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`
                relative shadow-sm
                ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}
              `}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Mais Popular
                  </div>
                )}
                
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">R$ {plan.price}</span>
                    <span className="text-gray-600">/mês</span>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center text-gray-600">
                        <Check className="w-5 h-5 text-blue-500 mr-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button className={`
                    w-full
                    ${plan.popular 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }
                  `}>
                    Começar Agora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-blue-500">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Junte-se a milhares de deliveries que já cresceram com nossa plataforma
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-500 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50">
              Criar Conta Grátis
            </Button>
            <Button variant="outline" size="lg" className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-500">
              Falar com Vendas
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-lg"></div>
                <span className="text-xl font-bold text-gray-900">DeliveryApp</span>
              </div>
              <p className="text-gray-600">
                Plataforma completa para delivery online.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Produto</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Empresa</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Carreiras</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Suporte</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Ajuda</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-100 mt-12 pt-8 text-center text-gray-600">
            <p>&copy; 2024 DeliveryApp. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}