import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const token = authHeader.replace("Bearer ", "");
    logStep("Extracting token from header");

    // Primeira tentativa: usar ANON key para validar o token
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    logStep("Attempting user authentication with ANON key");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    
    if (userError || !userData.user?.email) {
      logStep("ANON auth failed, trying SERVICE_ROLE key", { error: userError?.message });
      
      // Segunda tentativa: usar SERVICE_ROLE key
      const supabaseServiceAuth = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );
      
      const { data: serviceUserData, error: serviceUserError } = await supabaseServiceAuth.auth.getUser(token);
      
      if (serviceUserError || !serviceUserData.user?.email) {
        logStep("Both auth methods failed", { 
          anonError: userError?.message, 
          serviceError: serviceUserError?.message 
        });
        throw new Error(`Authentication failed: ${serviceUserError?.message || userError?.message || 'Unable to authenticate user'}`);
      }
      
      logStep("Authentication successful with SERVICE_ROLE", { 
        userId: serviceUserData.user.id, 
        email: serviceUserData.user.email 
      });
      
      // Use service data
      var user = serviceUserData.user;
    } else {
      logStep("Authentication successful with ANON", { 
        userId: userData.user.id, 
        email: userData.user.email 
      });
      
      // Use anon data
      var user = userData.user;
    }

    // Use SERVICE_ROLE key for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    logStep("Searching for Stripe customer", { email: user.email });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      await supabaseClient.from("subscriber_plans").upsert({
        user_id: user.id,
        email: user.email,
        stripe_customer_id: null,
        subscription_status: "inactive",
        plan_type: "free",
        subscription_start: null,
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      
      return new Response(JSON.stringify({ 
        subscribed: false, 
        plan_type: "free",
        subscription_status: "inactive" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let planType = "free";
    let subscriptionEnd = null;
    let subscriptionStart = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      subscriptionStart = new Date(subscription.current_period_start * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      // Determine plan type from product ID
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const productId = price.product;
      
      logStep("Determined plan type", { priceId, productId });
      
      // Map product IDs to plan types
      if (productId === "prod_SrUoyAbRcb6Qg8") {
        planType = "mensal";
      } else if (productId === "prod_SrUpK1iT4fKXq7") {
        planType = "anual";
      } else {
        // Fallback for other products based on amount
        const amount = price.unit_amount || 0;
        if (amount <= 999) {
          planType = "basic";
        } else if (amount <= 2999) {
          planType = "premium";
        } else {
          planType = "enterprise";
        }
      }
      logStep("Determined plan type", { priceId, productId, planType });
    } else {
      logStep("No active subscription found");
    }

    await supabaseClient.from("subscriber_plans").upsert({
      user_id: user.id,
      email: user.email,
      stripe_customer_id: customerId,
      subscription_status: hasActiveSub ? "active" : "inactive",
      plan_type: planType,
      subscription_start: subscriptionStart,
      subscription_end: subscriptionEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Updated database with subscription info", { subscribed: hasActiveSub, planType });
    
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan_type: planType,
      subscription_status: hasActiveSub ? "active" : "inactive",
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { 
      message: errorMessage, 
      stack: error instanceof Error ? error.stack : undefined,
      requestHeaders: {
        authorization: req.headers.get("Authorization") ? "Bearer [REDACTED]" : "missing",
        origin: req.headers.get("origin"),
        userAgent: req.headers.get("user-agent")
      }
    });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      subscribed: false,
      plan_type: "free",
      subscription_status: "inactive"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Return 200 instead of 500 to avoid triggering error handlers
    });
  }
});