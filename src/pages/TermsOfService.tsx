import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/dfb072c7-087e-48ca-88a3-40430f88a2d4.png" 
              alt="Gera Cardápio" 
              className="h-8 w-8"
            />
            <span className="text-xl font-bold">Gera Cardápio</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Termos de Uso</h1>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao acessar e usar o Gera Cardápio, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. 
              Se você não concordar com qualquer parte destes termos, não poderá usar nossos serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              O Gera Cardápio é uma plataforma de gestão para estabelecimentos de delivery que oferece:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Sistema de cardápio digital</li>
              <li>Gestão de pedidos online</li>
              <li>Analytics e relatórios</li>
              <li>Controle de horários de funcionamento</li>
              <li>Outras funcionalidades relacionadas ao delivery</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Cadastro e Conta</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Para usar nossos serviços, você deve:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Fornecer informações precisas e completas durante o cadastro</li>
              <li>Manter suas informações de conta atualizadas</li>
              <li>Ser responsável pela segurança de sua senha</li>
              <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Planos e Pagamentos</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Oferecemos diferentes planos de assinatura:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Os preços são cobrados antecipadamente em base mensal ou anual</li>
              <li>Todos os pagamentos são processados de forma segura</li>
              <li>Cancelamentos podem ser feitos a qualquer momento</li>
              <li>Reembolsos são processados conforme nossa política</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Uso Aceitável</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Você concorda em não usar nossos serviços para:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Atividades ilegais ou fraudulentas</li>
              <li>Violação de direitos de propriedade intelectual</li>
              <li>Distribuição de malware ou conteúdo malicioso</li>
              <li>Tentativas de acesso não autorizado ao sistema</li>
              <li>Uso comercial não autorizado</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Propriedade Intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todo o conteúdo, design, código e funcionalidades do Gera Cardápio são de nossa propriedade exclusiva. 
              Você recebe uma licença limitada para usar nossos serviços conforme estes termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              O Gera Cardápio é fornecido "como está". Não garantimos que o serviço será ininterrupto ou livre de erros. 
              Nossa responsabilidade é limitada ao valor pago por nossos serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Modificações dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Reservamos o direito de modificar estes termos a qualquer momento. 
              As mudanças serão comunicadas através da plataforma e entrarão em vigor imediatamente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Cancelamento</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você pode cancelar sua conta a qualquer momento. Nós também podemos suspender ou encerrar contas 
              que violem estes termos de uso.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para dúvidas sobre estes termos, entre em contato conosco através dos canais de suporte disponíveis na plataforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;