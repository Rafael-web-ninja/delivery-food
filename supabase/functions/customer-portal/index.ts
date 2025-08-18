import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    // Use ANON key for auth verification ONLY
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    logStep("Verifying user authentication");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError) {
      logStep("Authentication failed", userError);
      throw new Error(`Authentication error: ${userError.message}`);
    }
    const user = userData.user;
    if (!user?.email) {
      logStep("User email not available", { user });
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    logStep("Searching for Stripe customer", { email: user.email });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      logStep("No Stripe customer found", { email: user.email });
      throw new Error("No Stripe customer found for this user. Please subscribe to a plan first.");
    }
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const origin = req.headers.get("origin") || "https://preview--app-gera-cardapio.lovable.app";
    logStep("Creating customer portal session", { customerId, origin });
    
    // Try to create the portal session with configuration
    let portalSession;
    try {
      portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/subscription`,
      });
    } catch (stripeError: any) {
      logStep("Stripe portal creation failed", { error: stripeError.message });
      
      // If no configuration exists, provide a helpful error message
      if (stripeError.message?.includes("configuration") || stripeError.message?.includes("default configuration")) {
        throw new Error("O portal de pagamentos precisa ser configurado no Stripe. Por favor, acesse o dashboard do Stripe e configure o Customer Portal em Settings > Billing > Customer Portal.");
      }
      
      // Re-throw other Stripe errors
      throw stripeError;
    }
    logStep("Customer portal session created successfully", { 
      sessionId: portalSession.id, 
      url: portalSession.url,
      customerId 
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in customer-portal", { 
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      requestHeaders: {
        authorization: req.headers.get("Authorization") ? "Bearer [REDACTED]" : "missing",
        origin: req.headers.get("origin"),
        userAgent: req.headers.get("user-agent")
      }
    });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});