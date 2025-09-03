import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const log = (step: string, details?: unknown) =>
  console.log(`[SEND-AUTH-WELCOME-EMAIL] ${step}${details ? " - " + JSON.stringify(details) : ""}`);

const ok = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      log("Missing email");
      return ok({ sent: false, error: "Email is required" });
    }

    const to = email.trim().toLowerCase();
    const resetLink = "https://app.geracardapio.com/reset-password?type=welcome";

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
    const MAIL_FROM = Deno.env.get("MAIL_FROM") || "onboarding@resend.dev";

    if (!RESEND_API_KEY) {
      log("Missing RESEND_API_KEY");
      return ok({
        sent: false,
        error: "Missing RESEND_API_KEY (email not sent). Configure RESEND_API_KEY and MAIL_FROM.",
        resetLink,
      });
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
      </div>
    `;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [to],
        subject,
        html,
      }),
    });

    const text = await resp.text();
    if (!resp.ok) {
      log("Resend error", { status: resp.status, text });
      return ok({ sent: false, error: `Email provider error: ${text}` });
    }

    let payload: any = null;
    try { payload = JSON.parse(text); } catch {}
    log("Email sent", { to, id: payload?.id });

    return ok({ sent: true, id: payload?.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    log("Unhandled error", { message });
    return ok({ sent: false, error: message });
  }
});
