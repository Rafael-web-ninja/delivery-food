import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
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

    // Link SEM token (leva direto à tela do app)
    const resetLink = "https://app.geracardapio.com/reset-password?type=welcome";

    // ====== Caminho A: Enviar via Resend (recomendado p/ link sem token) ======
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
    const MAIL_FROM = Deno.env.get("MAIL_FROM") || "onboarding@resend.dev";

    if (RESEND_API_KEY) {
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
        // Continua 200, mas devolve erro descritivo pro front
        return ok({ sent: false, error: `Email provider error: ${text}` });
      }

      let payload: any = null;
      try { payload = JSON.parse(text); } catch {}
      return ok({ sent: true, id: payload?.id, provider: "resend" });
    }

    // ====== Caminho B (fallback): e-mail nativo do Supabase ======
    // ATENÇÃO: esse e-mail contém TOKEN no hash e deve redirecionar para /auth/callback
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return ok({
        sent: false,
        error: "Missing RESEND_API_KEY and also SUPABASE_URL/SUPABASE_ANON_KEY for fallback.",
      });
    }

    const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    const { error: mailErr } = await supabaseAnon.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: "https://app.geracardapio.com/auth/callback" }
    );

    if (mailErr) {
      return ok({ sent: false, error: `Supabase mailer error: ${mailErr.message}` });
    }

    return ok({
      sent: true,
      provider: "supabase",
      note: "Email enviado via Supabase. O link terá token no hash e vai para /auth/callback.",
    });

  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return ok({ sent: false, error: message });
  }
});
