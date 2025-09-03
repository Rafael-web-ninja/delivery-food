import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ADMIN-RESET-PASSWORD] ${step}${detailsStr}`);
};

interface ResetPasswordRequest {
  email: string;
  newPassword: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Service Role para operações admin
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    logStep("Request body received", {
      hasEmail: !!body.email,
      hasPassword: !!body.newPassword
    });

    const { email, newPassword }: ResetPasswordRequest = body;

    if (!email || !newPassword) {
      logStep("ERROR: Missing required fields");
      throw new Error("Email and newPassword are required");
    }

    if (newPassword.length < 6) {
      logStep("ERROR: Password too short");
      throw new Error("A senha deve ter pelo menos 6 caracteres");
    }

    // Busca o usuário pelo e-mail
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      logStep("ERROR: Failed to list users", { error: listError });
      throw new Error("Erro interno do servidor");
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      logStep("ERROR: User not found", { email });
      throw new Error("Usuário não encontrado");
    }

    // Atualiza a senha do usuário usando o Service Role
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { 
        password: newPassword,
        email_confirm: true // Garante que o e-mail seja confirmado
      }
    );

    if (updateError) {
      logStep("ERROR: Failed to update password", { error: updateError });
      throw new Error(`Erro ao atualizar senha: ${updateError.message}`);
    }

    logStep("Password updated successfully", { userId: user.id });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Senha alterada com sucesso"
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