// supabase/functions/send-auth-welcome-email/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function log(step: string, details?: unknown) {
  console.log(`[SEND-AUTH-WELCOME-EMAIL] ${step}${details ? " - " + JSON.stringify(details) : ""}`);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return json({ sent: false, error: "Email is required" });
    }

    // Link SEM token (leva direto para a tela do app)
    const resetLink = "https://app.geracardapio.com/reset-password?type=welcome";

    // Envio via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const MAIL_FROM = Deno.env.get("MAIL_FROM") || "onboarding@resend.dev";
    if (!RESEND_API_KEY) {
      log("Missing RESEND_API_KEY");
      return json({ sent: false, error: "Missing RESEND_API_KEY" });
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
        <p style="color:#666;font-size:12px">O link leva você à página de redefinição no app.</p>
      </div>
    `;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [email.toLowerCase().trim()],
        subject,
        html,
      }),
    });

    const bodyText = await r.text();
    if (!r.ok) {
      log("Resend failed", { status: r.status, bodyText });
      // Ainda respondemos 200, mas com sent:false para o front exibir o erro real
      return json({ sent: false, error: `Email provider error: ${bodyText}` });
    }

    const payload = (() => {
      try { return JSON.parse(bodyText); } catch { return null; }
    })();
    log("Email sent", { to: email, id: payload?.id });

    return json({ sent: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    log("Unhandled error", { message });
    // Também 200 aqui, para o front não receber “non-2xx”
    return json({ sent: false, error: message });
  }
});
