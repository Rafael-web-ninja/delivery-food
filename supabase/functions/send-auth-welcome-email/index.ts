import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return ok({ sent: false, error: "Email is required" });
    }

    const resetLink = "https://app.geracardapio.com/reset-password?type=welcome";

    // ===== Envio via Resend (opcional) =====
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const MAIL_FROM = Deno.env.get("MAIL_FROM") || "onboarding@resend.dev";
    if (!RESEND_API_KEY) {
      // Sem provider configurado: retorne 200 com erro claro
      return ok({ sent: false, error: "Missing RESEND_API_KEY (email not sent)", resetLink });
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
        to: [email.trim().toLowerCase()],
        subject,
        html,
      }),
    });

    const text = await resp.text();

    if (!resp.ok) {
      // Ainda 200, mas com erro detalhado
      return ok({ sent: false, error: `Email provider error: ${text}` });
    }

    let payload: any = null;
    try { payload = JSON.parse(text); } catch {}
    return ok({ sent: true, id: payload?.id, resetLink });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // Nunca 500: sempre 200 com erro descritivo
    return ok({ sent: false, error: message });
  }
});