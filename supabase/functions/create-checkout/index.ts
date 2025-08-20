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

  // Use ANON key for auth verification
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const { planType, guestCheckout } = await req.json();
    if (!planType) throw new Error("Plan type is required");
    logStep("Request data", { planType, guestCheckout });

    let user = null;
    const authHeader = req.headers.get("Authorization");
    
    // Try to authenticate user if auth header is provided
    if (authHeader && !guestCheckout) {
      logStep("Authorization header found, attempting authentication");
      const token = authHeader.replace("Bearer ", "");
      
      try {
        const { data, error } = await supabaseClient.auth.getUser(token);
        if (error) {
          logStep("Auth failed, proceeding as guest", { error: error.message });
        } else {
          user = data.user;
          logStep("User authenticated", { userId: user.id, email: user.email });
        }
      } catch (authError) {
        logStep("Auth error, proceeding as guest", { error: authError });
      }
    } else {
      logStep("No auth header or guest checkout requested, proceeding as guest");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // For guest checkout, we won't look up existing customers
    let customerId;
    let customerEmail;
    
    if (user?.email) {
      // Authenticated user - check for existing customer
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing customer found", { customerId });
      } else {
        customerEmail = user.email;
        logStep("Will create customer during checkout", { email: user.email });
      }
    } else {
      // Guest checkout - no customer lookup
      logStep("Guest checkout - customer will be created during payment");
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

    const sessionConfig: any = {
      line_items: [
        {
          price: priceObject.id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/`,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      metadata: {
        plan_type: planType,
        guest_checkout: guestCheckout ? "true" : "false"
      }
    };

    // Set customer or email based on authentication status
    if (customerId) {
      sessionConfig.customer = customerId;
    } else if (customerEmail) {
      sessionConfig.customer_email = customerEmail;
    }
    // For guest checkout, neither customer nor customer_email is set

    if (user?.id) {
      sessionConfig.metadata.user_id = user.id;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

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