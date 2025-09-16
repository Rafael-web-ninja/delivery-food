import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface WelcomeEmailProps {
  customerName: string;
  customerEmail: string;
  tempPassword: string;
  loginUrl: string;
  businessName: string;
  planType: string;
  amount: number;
}

export const WelcomeEmail = ({
  customerName,
  customerEmail,
  tempPassword,
  loginUrl,
  businessName = "GeraCardápio",
  planType,
  amount
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Bem-vindo ao GeraCardápio! Seu pagamento foi confirmado.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 Pagamento Confirmado!</Heading>
        
        <Text style={text}>
          Olá <strong>{customerName}</strong>,
        </Text>
        
        <Text style={text}>
          Seu pagamento de <strong>R$ {(amount / 100).toFixed(2)}</strong> para o plano <strong>{planType}</strong> foi processado com sucesso!
        </Text>

        <Section style={paymentSection}>
          <Text style={paymentTitle}>✅ Detalhes do Pagamento</Text>
          <Text style={paymentDetail}>Plano: {planType}</Text>
          <Text style={paymentDetail}>Valor: R$ {(amount / 100).toFixed(2)}</Text>
          <Text style={paymentDetail}>Status: Aprovado</Text>
        </Section>

        <Section style={credentialsSection}>
          <Text style={credentialsTitle}>🔑 Suas Credenciais de Acesso</Text>
          <Text style={text}>
            Criamos automaticamente sua conta. Use as informações abaixo para fazer login:
          </Text>
          
          <div style={credentialsBox}>
            <Text style={credentialLabel}>Email:</Text>
            <Text style={credentialValue}>{customerEmail}</Text>
            
            <Text style={credentialLabel}>Senha Temporária:</Text>
            <Text style={credentialValue}>{tempPassword}</Text>
          </div>

          <Button 
            href={loginUrl}
            style={loginButton}
          >
            Fazer Login Agora
          </Button>
        </Section>

        <Section style={importantSection}>
          <Text style={importantTitle}>⚠️ Importante</Text>
          <Text style={text}>
            • Esta é uma senha temporária gerada automaticamente
          </Text>
          <Text style={text}>
            • No seu primeiro login, recomendamos alterar a senha
          </Text>
          <Text style={text}>
            • Mantenha suas credenciais seguras
          </Text>
        </Section>

        <Text style={text}>
          Agora você pode começar a criar seu cardápio digital e gerenciar seu delivery!
        </Text>

        <Text style={footer}>
          Atenciosamente,<br />
          Equipe {businessName}
        </Text>
        
        <Text style={footerNote}>
          Se você não fez esta compra, entre em contato conosco imediatamente.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const paymentSection = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #e0f2fe',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const paymentTitle = {
  color: '#0369a1',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
}

const paymentDetail = {
  color: '#333',
  fontSize: '16px',
  margin: '8px 0',
}

const credentialsSection = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fbbf24',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const credentialsTitle = {
  color: '#92400e',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
}

const credentialsBox = {
  backgroundColor: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  padding: '16px',
  margin: '16px 0',
}

const credentialLabel = {
  color: '#374151',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '8px 0 4px 0',
}

const credentialValue = {
  color: '#1f2937',
  fontSize: '16px',
  fontFamily: 'monospace',
  backgroundColor: '#f9fafb',
  padding: '8px',
  borderRadius: '4px',
  margin: '0 0 12px 0',
}

const loginButton = {
  backgroundColor: '#059669',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '16px 0',
}

const importantSection = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fca5a5',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const importantTitle = {
  color: '#dc2626',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
}

const footer = {
  color: '#898989',
  fontSize: '16px',
  lineHeight: '24px',
  marginTop: '32px',
}

const footerNote = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '20px',
  marginTop: '32px',
  textAlign: 'center' as const,
}