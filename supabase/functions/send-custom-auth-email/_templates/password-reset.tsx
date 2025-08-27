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

interface PasswordResetProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
  user_email: string
}

export const PasswordResetTemplate = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  user_email,
}: PasswordResetProps) => (
  <Html>
    <Head />
    <Preview>Redefinir sua senha</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Redefinir Senha</Heading>
        <Text style={text}>
          Olá,
        </Text>
        <Text style={text}>
          Recebemos uma solicitação para redefinir a senha da sua conta no Sistema de Delivery.
        </Text>
        <Text style={text}>
          Para criar uma nova senha, clique no link abaixo:
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
          Redefinir Minha Senha
        </Link>
        <Text style={{ ...text, marginBottom: '14px' }}>
          Ou, copie e cole este código de redefinição:
        </Text>
        <code style={code}>{token}</code>
        <Text style={text}>
          <strong>Este link expira em 1 hora por motivos de segurança.</strong>
        </Text>
        <Text
          style={{
            ...text,
            color: '#ababab',
            marginTop: '14px',
            marginBottom: '16px',
          }}
        >
          Se você não solicitou a redefinição de senha, pode ignorar este e-mail com segurança. Sua senha atual permanecerá inalterada.
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

export default PasswordResetTemplate

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
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
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