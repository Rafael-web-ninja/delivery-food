import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

    // Retorne o link que deve ir no e-mail + metadados úteis
    return new Response(
      JSON.stringify({
        success: true,
        email,
        // Este é o link no botão do e-mail
        resetLink,
        // Indicativo para logs/observabilidade
        info: "Use 'resetLink' no e-mail. O action_link do Supabase foi gerado apenas para validar o fluxo, mas foi ignorado."
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