import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Prepare clients for auth attempts
  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    // Get the user from the token first
    const token = authHeader.replace("Bearer ", "");
    let user: any;
    let anonAuth = await supabaseAnon.auth.getUser(token);
    if (anonAuth.error || !anonAuth.data.user?.email) {
      logStep("ANON auth failed, trying SERVICE_ROLE", { error: anonAuth.error?.message });
      const serviceAuth = await supabaseService.auth.getUser(token);
      if (serviceAuth.error || !serviceAuth.data.user?.email) {
        throw new Error(`Authentication failed: ${serviceAuth.error?.message || anonAuth.error?.message || 'Unable to authenticate user'}`);
      }
      user = serviceAuth.data.user;
      logStep("User authenticated with SERVICE_ROLE", { userId: user.id, email: user.email });
    } else {
      user = anonAuth.data.user;
      logStep("User authenticated with ANON", { userId: user.id, email: user.email });
    }

    const { planType } = await req.json();
    if (!planType) throw new Error("Plan type is required");
    logStep("Plan type received", { planType });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("Creating new customer");
    }

    // Define pricing based on plan type - using real Stripe product IDs
    let priceId;
    switch (planType) {
      case "mensal":
        priceId = "prod_SrUoyAbRcb6Qg8"; // Plano mensal
        break;
      case "anual":
        priceId = "prod_SrUpK1iT4fKXq7"; // Plano anual  
        break;
      default:
        throw new Error("Invalid plan type");
    }

    // Get the actual price from Stripe
    const prices = await stripe.prices.list({
      product: priceId,
      active: true,
      limit: 1,
    });

    if (prices.data.length === 0) {
      throw new Error(`No active price found for product ${priceId}`);
    }

    const priceObject = prices.data[0];

    logStep("Creating checkout session", { priceId: priceObject.id, planType });

    const origin = req.headers.get("origin") || "https://preview--app-gera-cardapio.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceObject.id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscription-cancel`,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      metadata: {
        user_id: user.id,
        plan_type: planType
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { 
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