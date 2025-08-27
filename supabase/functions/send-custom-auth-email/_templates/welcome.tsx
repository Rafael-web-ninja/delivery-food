import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface WelcomeEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
  user_email: string
}

export const WelcomeTemplate = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  user_email,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Bem-vindo! Confirme seu e-mail para começar</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bem-vindo ao Sistema de Delivery!</Heading>
        <Text style={text}>
          Olá,
        </Text>
        <Text style={text}>
          Obrigado por se cadastrar! Para concluir seu cadastro e começar a fazer pedidos, confirme seu e-mail clicando no link abaixo:
        </Text>
        <Link
          href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
          target="_blank"
          style={{
            ...link,
            display: 'block',
            marginBottom: '16px',
            backgroundColor: '#16A34A',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            textAlign: 'center' as const,
          }}
        >
          Confirmar E-mail e Começar
        </Link>
        <Text style={{ ...text, marginBottom: '14px' }}>
          Ou, copie e cole este código de confirmação:
        </Text>
        <code style={code}>{token}</code>
        <Text style={text}>
          Após confirmar seu e-mail, você poderá:
        </Text>
        <ul style={list}>
          <li style={listItem}>Fazer pedidos nos seus restaurantes favoritos</li>
          <li style={listItem}>Acompanhar o status dos seus pedidos em tempo real</li>
          <li style={listItem}>Salvar seus endereços e formas de pagamento</li>
          <li style={listItem}>Ver o histórico de todos os seus pedidos</li>
        </ul>
        <Text
          style={{
            ...text,
            color: '#ababab',
            marginTop: '14px',
            marginBottom: '16px',
          }}
        >
          Se você não criou esta conta, pode ignorar este e-mail com segurança.
        </Text>
        <Text style={footer}>
          <Link
            href="#"
            target="_blank"
            style={{ ...link, color: '#898989' }}
          >
            Sistema de Delivery
          </Link>
          - Sua plataforma de pedidos online
        </Text>
      </Container>
    </Body>
  </Html>
)

export default WelcomeTemplate

const main = {
  backgroundColor: '#ffffff',
}

const container = {
  paddingLeft: '12px',
  paddingRight: '12px',
  margin: '0 auto',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const link = {
  color: '#16A34A',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  textDecoration: 'underline',
}

const text = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const list = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '16px',
  lineHeight: '24px',
  paddingLeft: '20px',
  margin: '16px 0',
}

const listItem = {
  margin: '8px 0',
}

const footer = {
  color: '#898989',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '32px',
  marginBottom: '24px',
  borderTop: '1px solid #eee',
  paddingTop: '16px',
  textAlign: 'center' as const,
}

const code = {
  display: 'inline-block',
  padding: '16px 4.5%',
  width: '90.5%',
  backgroundColor: '#f4f4f4',
  borderRadius: '5px',
  border: '1px solid #eee',
  color: '#333',
  fontFamily: 'monospace',
  fontSize: '14px',
  letterSpacing: '1px',
}