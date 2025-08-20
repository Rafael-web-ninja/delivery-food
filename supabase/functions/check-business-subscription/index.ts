import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-BUSINESS-SUBSCRIPTION] ${step}${detailsStr}`);
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

    // Use the service role key to securely access business data
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { businessId } = await req.json();
    if (!businessId) {
      throw new Error("businessId is required");
    }
    logStep("Request validated", { businessId });

    // Get business owner information
    const { data: business, error: businessError } = await supabaseClient
      .from('delivery_businesses')
      .select('owner_id')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      throw new Error("Business not found");
    }
    logStep("Business found", { ownerId: business.owner_id });

    // Get owner's email from auth.users
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(business.owner_id);
    if (userError || !userData.user) {
      throw new Error("Business owner not found");
    }
    logStep("Business owner found", { email: userData.user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: userData.user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, business subscription inactive");
      return new Response(JSON.stringify({ subscribed: false, plan_type: 'free' }), {
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
    let planType = 'free';

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        endDate: new Date(subscription.current_period_end * 1000).toISOString() 
      });
      
      // Determine plan type from price
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      logStep("Determined plan type", { priceId, amount: price.unit_amount, planType });
      
      // Map to our plan types
      if (priceId === "price_1RvlpLE8ObXeYfYS81eZRMMa") {
        planType = "mensal";
      } else if (priceId === "price_1RvlpYE8ObXeYfYS2mNYwGXf") {
        planType = "anual";
      } else {
        // Fallback based on amount
        const amount = price.unit_amount || 0;
        if (amount <= 1500) {
          planType = "mensal";
        } else {
          planType = "anual";
        }
      }
    } else {
      logStep("No active subscription found");
    }

    const result = { subscribed: hasActiveSub, plan_type: planType };
    logStep("Returning result", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-business-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});