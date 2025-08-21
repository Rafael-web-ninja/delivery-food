import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-WELCOME-EMAIL] ${step}${detailsStr}`);
};

interface WelcomeEmailRequest {
  email: string;
  password: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      logStep("ERROR: RESEND_API_KEY is not set");
      throw new Error("RESEND_API_KEY is not set");
    }
    logStep("Resend key verified");

    const resend = new Resend(resendKey);

    const body = await req.json();
    logStep("Request body received", { hasEmail: !!body.email, hasPassword: !!body.password });
    
    const { email, password, userId }: WelcomeEmailRequest = body;
    
    if (!email || !password) {
      logStep("ERROR: Missing required fields");
      throw new Error("Email and password are required");
    }

    logStep("Sending welcome email", { email, userId });

    const emailResponse = await resend.emails.send({
      from: "Gera Cardápio <onboarding@resend.dev>",
      to: [email],
      subject: "Bem-vindo! Sua assinatura foi ativada",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Bem-vindo ao Gera Cardápio!</h1>
          
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            Sua assinatura foi ativada com sucesso! Agora você pode acessar sua conta e começar a usar todos os recursos disponíveis.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1e293b; margin-bottom: 15px;">Dados de Acesso:</h2>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 10px 0;"><strong>Senha temporária:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</code></p>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>Importante:</strong> Por segurança, recomendamos que você altere sua senha assim que fizer o primeiro login.
            </p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.5; margin: 20px 0;">
            Para acessar sua conta, visite nosso site e faça login com as credenciais acima.
          </p>
          
          <div style="margin: 30px 0;">
            <a href="${req.headers.get("origin") || "https://app.geracardapio.com"}/auth" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Fazer Login
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; line-height: 1.5; margin-top: 40px;">
            Se você não fez esta compra, entre em contato conosco imediatamente.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            Gera Cardápio - Sua solução completa para delivery
          </p>
        </div>
      `,
    });

    logStep("Email sent successfully", { messageId: emailResponse.data?.id });

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});