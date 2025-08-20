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

    // Validate environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables are not set");
    }
    logStep("Environment variables validated");

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No valid authorization header provided");
    }
    
    const token = authHeader.replace("Bearer ", "");
    logStep("Token extracted from header");

    // Initialize Supabase client with service role for user verification
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user?.email) {
      logStep("Authentication failed", { error: authError?.message });
      throw new Error("User authentication failed");
    }
    
    logStep("User authenticated successfully", { userId: user.id, email: user.email });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Search for Stripe customer
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      
      // Update database with no subscription
      await supabase.from("subscriber_plans").upsert({
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
        subscription_status: "inactive",
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Stripe customer found", { customerId });

    // Get active subscriptions
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
      
      // Get price details to determine plan type
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const productId = typeof price.product === 'string' ? price.product : price.product.id;
      
      // Map product IDs to plan types
      switch (productId) {
        case "prod_SrUoyAbRcb6Qg8":
          planType = "mensal";
          break;
        case "prod_SrUpK1iT4fKXq7":
          planType = "anual";
          break;
        default:
          // Fallback based on amount
          const amount = price.unit_amount || 0;
          if (amount <= 999) planType = "basic";
          else if (amount <= 2999) planType = "premium";
          else planType = "enterprise";
      }
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        planType, 
        endDate: subscriptionEnd 
      });
    } else {
      logStep("No active subscription found");
    }

    // Update database
    await supabase.from("subscriber_plans").upsert({
      user_id: user.id,
      email: user.email,
      stripe_customer_id: customerId,
      subscription_status: hasActiveSub ? "active" : "inactive",
      plan_type: planType,
      subscription_start: subscriptionStart,
      subscription_end: subscriptionEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Database updated successfully");

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
    logStep("ERROR", { 
      message: errorMessage, 
      stack: error instanceof Error ? error.stack : undefined 
    });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      subscribed: false,
      plan_type: "free",
      subscription_status: "inactive",
      subscription_end: null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Return 200 to avoid breaking the frontend
    });
  }
});