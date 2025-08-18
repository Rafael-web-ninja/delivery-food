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
    
    // Try to create the portal session. If no configuration exists, auto-create one.
    let portalSession;
    try {
      portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/subscription`,
      });
    } catch (stripeError: any) {
      const msg = stripeError?.message || String(stripeError);
      logStep("Stripe portal creation failed", { error: msg });
      
      // Auto-create a default configuration in test mode if missing
      if (msg.includes("No configuration provided") || msg.includes("default configuration")) {
        logStep("No portal configuration found - creating a default configuration");
        try {
          const configuration = await stripe.billingPortal.configurations.create({
            features: {
              payment_method_update: { enabled: true },
              invoice_history: { enabled: true },
              subscription_cancel: { enabled: true, mode: "at_period_end" },
            },
          });
          logStep("Created portal configuration", { configurationId: configuration.id });
          
          portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${origin}/subscription`,
            configuration: configuration.id,
          });
          logStep("Portal session created with new configuration", { sessionId: portalSession.id, url: portalSession.url });
        } catch (cfgErr: any) {
          const cfgMsg = cfgErr?.message || String(cfgErr);
          logStep("Failed to auto-create configuration", { error: cfgMsg });
          throw new Error("Não foi possível configurar o portal de pagamentos automaticamente. Configure o Customer Portal no Stripe em Settings > Billing > Customer Portal e tente novamente.");
        }
      } else {
        // Re-throw other Stripe errors with message
        throw new Error(msg);
      }
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