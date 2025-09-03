import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SEND-AUTH-WELCOME-EMAIL] ${step}${detailsStr}`);
};

interface WelcomeEmailRequest {
  email: string;
  temporaryPassword: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Service Role para operações admin
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    logStep("Request body received", {
      hasEmail: !!body.email,
      hasPassword: !!body.temporaryPassword
    });

    const { email, temporaryPassword }: WelcomeEmailRequest = body;

    if (!email || !temporaryPassword) {
      logStep("ERROR: Missing required fields");
      throw new Error("Email and temporaryPassword are required");
    }

    // (Opcional) Verifica se o usuário existe
    const { data: userList, error: userFetchError } = await supabaseClient.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      // OBS: listUsers não filtra por e-mail, então vamos tentar getUserById se tiver id,
      // mas como não temos id aqui, iremos seguir. Esse passo é opcional.
    });

    if (userFetchError) {
      logStep("WARN: listUsers error (ignorable)", { error: userFetchError.message });
    }

    // Gera um link de recuperação (APENAS para validar o fluxo no backend).
    // NÃO vamos usar o action_link (que tem token)!
    const { error: linkError } = await supabaseClient.auth.admin.generateLink({
      type: "recovery",
      email: email,
      // Não precisamos de redirectTo aqui, pois ignoraremos o action_link.
    });

    if (linkError) {
      logStep("ERROR generating recovery link", { error: linkError });
      throw new Error(`Failed to generate recovery link: ${linkError.message}`);
    }

    // Este é o link que você vai colocar no botão do e-mail (SEM TOKEN)
    const resetLink = "https://app.geracardapio.com/reset-password";

    logStep("Reset link prepared (no token, fixed path)", { resetLink });

    // Inicializar Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    if (!Deno.env.get("RESEND_API_KEY")) {
      logStep("ERROR: RESEND_API_KEY not configured");
      throw new Error("RESEND_API_KEY not configured");
    }

    // Enviar o e-mail de recuperação
    const emailResponse = await resend.emails.send({
      from: "Gera Cardápio <noreply@geracardapio.com>",
      to: [email],
      subject: "Recuperação de Senha - Gera Cardápio",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Recuperação de Senha</h1>
          <p style="color: #666; font-size: 16px;">Olá!</p>
          <p style="color: #666; font-size: 16px;">
            Recebemos uma solicitação para redefinir a senha da sua conta no Gera Cardápio.
          </p>
          <p style="color: #666; font-size: 16px;">
            Sua senha temporária é: <strong style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px;">${temporaryPassword}</strong>
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Redefinir Senha
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">
            Se você não solicitou a recuperação de senha, pode ignorar este e-mail.
          </p>
          <p style="color: #999; font-size: 14px;">
            Este link é válido por 24 horas.
          </p>
        </div>
      `,
    });

    if (emailResponse.error) {
      logStep("ERROR sending email", { error: emailResponse.error });
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    logStep("Email sent successfully", { emailId: emailResponse.data?.id });

    return new Response(
      JSON.stringify({
        success: true,
        email,
        emailId: emailResponse.data?.id,
        message: "E-mail de recuperação enviado com sucesso"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
