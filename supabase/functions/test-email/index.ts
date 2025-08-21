import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function logStep(step: string, details?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${step}`, details ? JSON.stringify(details, null, 2) : '');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("🧪 TESTE DE EMAIL INICIADO");

    const { email } = await req.json();
    if (!email) {
      throw new Error("Email é obrigatório");
    }

    logStep("📧 Email de destino", { email });

    // Verificar se a chave da API está configurada
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY não configurado");
    }

    logStep("🔑 RESEND_API_KEY encontrado", { keyExists: true, keyLength: resendApiKey.length });

    const resend = new Resend(resendApiKey);

    logStep("📤 Enviando email de teste...");

    const result = await resend.emails.send({
      from: "Teste <onboarding@resend.dev>",
      to: [email],
      subject: "🧪 Email de Teste - Sistema Funcionando",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">✅ Sistema de Email Funcionando!</h1>
          <p>Este é um email de teste para verificar se o Resend está funcionando corretamente.</p>
          <p><strong>Enviado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <p><strong>Email de destino:</strong> ${email}</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 14px;">
            Se você recebeu este email, significa que o sistema de notificações está funcionando perfeitamente.
          </p>
        </div>
      `,
    });

    logStep("✅ Email enviado com sucesso!", result);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email de teste enviado com sucesso!",
        resendResponse: result,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    logStep("❌ ERRO no teste de email", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});