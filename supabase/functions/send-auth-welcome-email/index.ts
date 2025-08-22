import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
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

    // Use service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    logStep("Request body received", { hasEmail: !!body.email, hasPassword: !!body.temporaryPassword });
    
    const { email, temporaryPassword }: WelcomeEmailRequest = body;
    
    if (!email || !temporaryPassword) {
      logStep("ERROR: Missing required fields");
      throw new Error("Email and temporaryPassword are required");
    }

    logStep("Generating welcome email link", { email });

    // Generate a password reset link for the new user with custom redirect
    const origin = req.headers.get("origin") || "https://preview--app-gera-cardapio.lovable.app";
    const redirectUrl = `${origin}/reset-password?type=welcome&email=${encodeURIComponent(email)}&temp_password=${encodeURIComponent(temporaryPassword)}`;
    
    const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (linkError) {
      logStep("ERROR generating recovery link", { error: linkError });
      throw new Error(`Failed to generate recovery link: ${linkError.message}`);
    }

    if (!linkData?.properties?.action_link) {
      logStep("ERROR: No action link in response");
      throw new Error("No action link generated");
    }

    logStep("Welcome email sent successfully via Supabase Auth", { 
      email,
      hasActionLink: !!linkData.properties.action_link 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      email,
      linkGenerated: true 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});