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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    // Get the user from the token first
    const token = authHeader.replace("Bearer ", "");
    
    // First try to get user with session validation
    let user;
    try {
      const { data, error } = await supabaseClient.auth.getUser(token);
      if (error) {
        console.log('First auth attempt failed:', error.message);
        // Try alternative auth method
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError || !sessionData.session) {
          throw new Error(`Authentication failed: ${error.message || sessionError?.message || 'No session'}`);
        }
        user = sessionData.session.user;
      } else {
        user = data.user;
      }
    } catch (authError) {
      logStep("Authentication failed, trying session approach");
      // Last resort - try to validate token directly
      try {
        const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
          headers: {
            'Authorization': authHeader,
            'apikey': Deno.env.get("SUPABASE_ANON_KEY") || ''
          }
        });
        
        if (!response.ok) {
          throw new Error('Token validation failed');
        }
        
        user = await response.json();
      } catch (fetchError) {
        throw new Error(`Authentication error: Unable to validate user token`);
      }
    }
    
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

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
      success_url: `${req.headers.get("origin")}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/subscription-cancel`,
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