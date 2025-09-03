import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[SEND-AUTH-WELCOME-EMAIL] ${step}${details ? " - " + JSON.stringify(details) : ""}`);
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface WelcomeEmailRequest {
  email: string;
  temporaryPassword?: string; // opcional aqui; não usamos no e-mail
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    logStep("Function started");

    const { email }: WelcomeEmailRequest = await req.json();
    if (!email) return json({ error: "Email is required" }, 400);

    // Client admin (service role) para validações internas, se quiser
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // (Opcional) Gera um link de recuperação só para auditar/validar que o email existe
    // OBS: generateLink NÃO envia e-mail.
    const { error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
    });
    if (linkError) {
      logStep("ERROR generating recovery link", { error: linkError.message });
      // Podemos seguir mesmo assim, mas é útil retornar erro claro:
      return json({ error: `Failed to generate recovery link: ${linkError.message}` }, 400);
    }

    // Link fixo SEM token – leva o usuário à tela do app
    const resetLink = "https://app.geracardapio.com/reset-password";

    // ===== Envio do e-mail via Resend =====
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const MAIL_FROM = Deno.env.get("MAIL_FROM") || "noreply@geracardapio.com";
    
    if (!RESEND_API_KEY) {
      logStep("ERROR: Missing RESEND_API_KEY");
      return json({ error: "Missing RESEND_API_KEY" }, 500);
    }

    const subject = "Redefinição de senha - Gera Cardápio";
    const html = `
      <div style="font-family: Arial, sans-serif; line-height:1.5">
        <h2>Redefinir senha</h2>
        <p>Recebemos um pedido para redefinir sua senha no <b>Gera Cardápio</b>.</p>
        <p>Clique no botão abaixo para criar uma nova senha. Você não será logado automaticamente.</p>
        <p style="margin:24px 0">
          <a href="${resetLink}" style="background:#2563eb;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block">
            Redefinir minha senha
          </a>
        </p>
        <p>Se você não solicitou, ignore este e-mail.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
        <p style="color:#666;font-size:12px">Esse link direciona para a página de redefinição no app.</p>
      </div>
    `;

    logStep("Attempting to send email", { to: email, from: MAIL_FROM });

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [email],
        subject,
        html,
      }),
    });

    const respText = await r.text();
    if (!r.ok) {
      logStep("Resend error", { status: r.status, respText });
      return json({ error: `Email provider error: ${respText}` }, 502);
    }

    const sent = JSON.parse(respText);
    logStep("Email sent", { id: sent?.id, to: email });

    return json({ sent: true, resetLink });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return json({ error: message }, 500);
  }
});