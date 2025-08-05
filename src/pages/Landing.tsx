import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Menu, X, Check, Star } from "lucide-react";
export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const benefits = [{
    title: "Painel Administrativo",
    desc: "Gerencie pedidos, produtos e clientes em tempo real"
  }, {
    title: "Pagamentos Integrados",
    desc: "Receba pagamentos via cartão, PIX e dinheiro"
  }, {
    title: "Relatórios Detalhados",
    desc: "Acompanhe suas vendas e performance"
  }, {
    title: "App para Clientes",
    desc: "Seus clientes fazem pedidos pelo app"
  }];
  const steps = [{
    step: "1",
    title: "Cadastre-se",
    desc: "Registre seu delivery em minutos",
    icon: "📝"
  }, {
    step: "2",
    title: "Configure",
    desc: "Adicione produtos e defina preços",
    icon: "⚙️"
  }, {
    step: "3",
    title: "Venda",
    desc: "Receba pedidos e acompanhe vendas",
    icon: "🚀"
  }];
  const plans = [{
    name: "Básico",
    price: "49",
    features: ["Até 100 pedidos/mês", "1 usuário", "Suporte email"]
  }, {
    name: "Profissional",
    price: "99",
    popular: true,
    features: ["Pedidos ilimitados", "3 usuários", "Suporte prioritário", "Relatórios avançados"]
  }, {
    name: "Enterprise",
    price: "199",
    features: ["Tudo do Pro", "Usuários ilimitados", "API personalizada", "Gerente dedicado"]
  }];
  const testimonials = [{
    name: "João Silva",
    role: "Proprietário - Pizza Express",
    text: "Aumentei minhas vendas em 300% em apenas 2 meses!",
    rating: 5
  }, {
    name: "Maria Santos",
    role: "Gerente - Burger House",
    text: "Sistema perfeito, fácil de usar e clientes adoram!",
    rating: 5
  }, {
    name: "Carlos Lima",
    role: "Chef - Sushi Zen",
    text: "Controle total dos pedidos, recomendo demais!",
    rating: 5
  }];
  return <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header Clean e Responsivo */}
      <header className="fixed top-0 left-0 right-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between w-full">
            {/* Logo - Responsiva */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex-shrink-0"></div>
              <span className="text-lg sm:text-xl font-bold text-gray-900 whitespace-nowrap">DeliveryApp</span>
            </div>
            
            {/* Desktop Menu - Hidden on mobile */}
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 flex-shrink-0">
              <a href="#como-funciona" className="text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">Como Funciona</a>
              <a href="#precos" className="text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">Preços</a>
              <a href="#contato" className="text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">Contato</a>
            </nav>
            
            {/* CTAs - Desktop */}
            <div className="hidden lg:flex items-center space-x-3 flex-shrink-0">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm whitespace-nowrap">
                Entrar
              </Button>
              <Button size="sm" className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 text-sm whitespace-nowrap">
                Começar
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button className="lg:hidden flex-shrink-0 p-2" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && <div className="lg:hidden mt-4 pb-4 border-t border-gray-100 overflow-hidden">
              <nav className="flex flex-col space-y-3 mt-4">
                <a href="#como-funciona" className="text-gray-600 hover:text-gray-900 py-2 text-sm" onClick={() => setIsMenuOpen(false)}>Como Funciona</a>
                <a href="#precos" className="text-gray-600 hover:text-gray-900 py-2 text-sm" onClick={() => setIsMenuOpen(false)}>Preços</a>
                <a href="#contato" className="text-gray-600 hover:text-gray-900 py-2 text-sm" onClick={() => setIsMenuOpen(false)}>Contato</a>
                <div className="flex flex-col space-y-2 pt-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start">Entrar</Button>
                  <Button size="sm" className="bg-blue-500 text-white hover:bg-blue-600 w-full">Começar</Button>
                </div>
              </nav>
            </div>}
        </div>
      </header>

      {/* Hero Section - Corrigido para responsividade */}
      <section className="pt-20 sm:pt-24 pb-16 sm:pb-20 bg-white overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8">
              ✨ Plataforma de Delivery Completa
            </div>
            
            {/* Title - Responsivo */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-2">
              Conecte seu delivery com
              <span className="text-blue-500"> milhares de clientes</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
              Sistema completo de gestão para delivery com painel administrativo, 
              controle de pedidos e pagamentos integrados.
            </p>
            
            {/* CTAs - Responsivos */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 px-4">
              <Button size="lg" className="bg-blue-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:bg-blue-600 shadow-md text-sm sm:text-base">
                Criar Meu Delivery
              </Button>
              <Button variant="outline" size="lg" className="border border-gray-200 text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:bg-gray-50 text-sm sm:text-base">
                Ver Demo
              </Button>
            </div>
            
            {/* Preview - Responsivo */}
            <div className="relative max-w-4xl mx-auto px-4">
              <div className="bg-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg">
                <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm">
                  <div className="h-48 sm:h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-base sm:text-lg">Dashboard Preview</span>
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
            {steps.map((item, index) => <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center text-2xl mb-6 mx-auto">
                  {item.icon}
                </div>
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mb-4 mx-auto">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>)}
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
                {benefits.map((benefit, index) => <div key={index} className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.desc}</p>
                    </div>
                  </div>)}
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
            {testimonials.map((testimonial, index) => <Card key={index} className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />)}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>)}
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
            {plans.map((plan, index) => <Card key={index} className={`
                relative shadow-sm
                ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}
              `}>
                {plan.popular && <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Mais Popular
                  </div>}
                
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">R$ {plan.price}</span>
                    <span className="text-gray-600">/mês</span>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, fIndex) => <li key={fIndex} className="flex items-center text-gray-600">
                        <Check className="w-5 h-5 text-blue-500 mr-3" />
                        {feature}
                      </li>)}
                  </ul>
                  
                  <Button className={`
                    w-full
                    ${plan.popular ? 'bg-blue-500 text-white hover:bg-blue-600' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}
                  `}>
                    Começar Agora
                  </Button>
                </CardContent>
              </Card>)}
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
            <Button variant="outline" size="lg" className="border-2 border-white px-8 py-4 rounded-xl font-semibold hover:bg-white text-stone-950">
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
            <p>© 2025 DeliveryApp. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>;
}