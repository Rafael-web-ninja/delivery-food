import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
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
        <h1 className="text-4xl font-bold mb-8">Política de Privacidade</h1>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Informações que Coletamos</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Coletamos informações que você nos fornece diretamente e automaticamente quando usa nossos serviços:
            </p>
            
            <h3 className="text-xl font-semibold mb-3">Informações Fornecidas por Você:</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Dados de cadastro (nome, email, telefone)</li>
              <li>Informações do estabelecimento</li>
              <li>Dados de pagamento (processados por terceiros seguros)</li>
              <li>Conteúdo do cardápio e produtos</li>
              <li>Comunicações conosco</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Informações Coletadas Automaticamente:</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Dados de uso e navegação</li>
              <li>Informações do dispositivo e navegador</li>
              <li>Endereço IP e localização aproximada</li>
              <li>Cookies e tecnologias similares</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Como Usamos suas Informações</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Fornecer e melhorar nossos serviços</li>
              <li>Processar pagamentos e transações</li>
              <li>Enviar comunicações importantes sobre sua conta</li>
              <li>Oferecer suporte técnico</li>
              <li>Personalizar sua experiência</li>
              <li>Analisar uso e tendências para melhorar a plataforma</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Compartilhamento de Informações</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Não vendemos suas informações pessoais. Podemos compartilhar dados limitados com:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provedores de serviços (pagamento, hospedagem, analytics)</li>
              <li>Autoridades legais quando exigido por lei</li>
              <li>Sucessores em caso de fusão ou aquisição</li>
              <li>Com seu consentimento explícito</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Segurança dos Dados</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Implementamos medidas de segurança robustas para proteger suas informações:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Criptografia de dados em trânsito e em repouso</li>
              <li>Controles de acesso rigorosos</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backups regulares e seguros</li>
              <li>Conformidade com padrões da indústria</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Seus Direitos</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Você tem os seguintes direitos sobre suas informações pessoais:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Acesso: solicitar cópia dos seus dados</li>
              <li>Correção: corrigir informações incorretas</li>
              <li>Exclusão: solicitar remoção dos seus dados</li>
              <li>Portabilidade: receber seus dados em formato legível</li>
              <li>Restrição: limitar o processamento em certas situações</li>
              <li>Objeção: opor-se ao processamento para fins específicos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Cookies e Tecnologias Similares</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Usamos cookies para melhorar sua experiência:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Cookies essenciais para funcionamento da plataforma</li>
              <li>Cookies de analytics para entender o uso</li>
              <li>Cookies de preferências para personalização</li>
              <li>Você pode gerenciar cookies nas configurações do navegador</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Retenção de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mantemos suas informações pelo tempo necessário para fornecer nossos serviços, 
              cumprir obrigações legais e resolver disputas. Dados inativos são excluídos periodicamente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Menores de Idade</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nossos serviços não são direcionados a menores de 18 anos. 
              Não coletamos intencionalmente informações de menores sem consentimento parental.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Transferências Internacionais</h2>
            <p className="text-muted-foreground leading-relaxed">
              Seus dados podem ser processados em servidores localizados fora do Brasil, 
              sempre com garantias adequadas de proteção conforme a LGPD.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Mudanças nesta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar esta política ocasionalmente. Mudanças significativas serão comunicadas 
              através da plataforma ou por email, com prazo adequado para revisão.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contato</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Para questões sobre privacidade ou exercer seus direitos, entre em contato:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Através dos canais de suporte na plataforma</li>
              <li>Por email para questões de privacidade</li>
              <li>Via formulário de contato em nosso site</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Base Legal (LGPD)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Processamos seus dados com base no consentimento, execução de contrato, 
              legítimo interesse e cumprimento de obrigações legais, sempre em conformidade com a 
              Lei Geral de Proteção de Dados (LGPD).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;