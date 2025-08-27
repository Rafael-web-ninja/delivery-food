import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { EmailChangeTemplate } from './_templates/email-change.tsx'
import { WelcomeTemplate } from './_templates/welcome.tsx'
import { PasswordResetTemplate } from './_templates/password-reset.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function logStep(step: string, details?: any) {
  console.log(`[send-custom-auth-email] ${step}`, details ? JSON.stringify(details) : '');
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })
  }

  try {
    logStep('Processing auth email webhook')

    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    
    logStep('Received payload', { hasPayload: !!payload, headersCount: Object.keys(headers).length })

    if (!hookSecret) {
      logStep('Missing webhook secret')
      return new Response('Webhook secret not configured', { 
        status: 500,
        headers: corsHeaders 
      })
    }

    const wh = new Webhook(hookSecret)
    
    const webhookData = wh.verify(payload, headers) as {
      user: {
        email: string
      }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
        site_url: string
      }
    }

    logStep('Webhook verified', { 
      email: webhookData.user.email, 
      actionType: webhookData.email_data.email_action_type 
    })

    const { user, email_data } = webhookData
    const { token, token_hash, redirect_to, email_action_type } = email_data

    let html: string
    let subject: string
    let fromName: string = 'Sistema de Delivery'

    // Determine template based on action type
    switch (email_action_type) {
      case 'signup':
        html = await renderAsync(
          React.createElement(WelcomeTemplate, {
            supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
            token,
            token_hash,
            redirect_to,
            email_action_type,
            user_email: user.email,
          })
        )
        subject = 'Bem-vindo! Confirme seu e-mail para começar'
        break

      case 'email_change':
        html = await renderAsync(
          React.createElement(EmailChangeTemplate, {
            supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
            token,
            token_hash,
            redirect_to,
            email_action_type,
            user_email: user.email,
          })
        )
        subject = 'Confirme a alteração do seu e-mail'
        break

      case 'recovery':
      case 'magiclink':
        html = await renderAsync(
          React.createElement(PasswordResetTemplate, {
            supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
            token,
            token_hash,
            redirect_to,
            email_action_type,
            user_email: user.email,
          })
        )
        subject = 'Redefinir sua senha'
        break

      default:
        logStep('Unknown email action type', { email_action_type })
        return new Response('Unknown email action type', { 
          status: 400,
          headers: corsHeaders 
        })
    }

    logStep('Sending email', { 
      to: user.email, 
      subject,
      actionType: email_action_type 
    })

    const { error } = await resend.emails.send({
      from: `${fromName} <onboarding@resend.dev>`,
      to: [user.email],
      subject,
      html,
    })

    if (error) {
      logStep('Resend error', error)
      throw error
    }

    logStep('Email sent successfully')

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      },
    })

  } catch (error) {
    logStep('Error processing email', error)
    console.error('Error:', error)
    
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code || 500,
          message: error.message || 'Erro interno do servidor',
        },
      }),
      {
        status: error.code || 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    )
  }
})