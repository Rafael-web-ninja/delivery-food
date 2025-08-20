import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-CHECKOUT-SUCCESS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use SERVICE ROLE key for admin operations
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Session ID is required");
    logStep("Processing session", { sessionId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription']
    });

    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    logStep("Session retrieved", { 
      customerEmail: session.customer_details?.email,
      subscriptionId: session.subscription,
      guestCheckout: session.metadata?.guest_checkout 
    });

    const customerEmail = session.customer_details?.email;
    if (!customerEmail) {
      throw new Error("No customer email found in session");
    }

    // Check if user already exists
    const { data: existingUser, error: userError } = await supabaseClient.auth.admin.getUserByEmail(customerEmail);
    
    let userId;
    if (existingUser && !userError) {
      userId = existingUser.id;
      logStep("Existing user found", { userId });
    } else {
      // Create new user if this was a guest checkout
      if (session.metadata?.guest_checkout === "true") {
        logStep("Creating new user for guest checkout", { email: customerEmail });
        
        const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
          email: customerEmail,
          email_confirm: true, // Auto-confirm email since they completed payment
        });

        if (createError || !newUser.user) {
          logStep("Failed to create user", { error: createError });
          throw new Error(`Failed to create user: ${createError?.message}`);
        }

        userId = newUser.user.id;
        logStep("New user created", { userId });
      } else {
        throw new Error("User not found and not a guest checkout");
      }
    }

    // Update subscription data in database
    if (session.subscription && typeof session.subscription === 'object') {
      const subscription = session.subscription as Stripe.Subscription;
      const planType = session.metadata?.plan_type || 'mensal';
      
      // Upsert subscriber_plans record
      const { error: upsertError } = await supabaseClient
        .from('subscriber_plans')
        .upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          plan_type: planType,
          subscription_status: subscription.status,
          subscription_start: new Date(subscription.current_period_start * 1000).toISOString(),
          subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        logStep("Failed to update subscription data", { error: upsertError });
        throw new Error(`Failed to update subscription: ${upsertError.message}`);
      }

      logStep("Subscription data updated", { userId, planType, status: subscription.status });
    }

    // Generate auth token for the user if this was a guest checkout
    let authResponse = null;
    if (session.metadata?.guest_checkout === "true") {
      const { data: tokenData, error: tokenError } = await supabaseClient.auth.admin.generateLink({
        type: 'magiclink',
        email: customerEmail,
      });

      if (!tokenError && tokenData.properties?.action_link) {
        // Extract the token from the action_link
        const url = new URL(tokenData.properties.action_link);
        const token = url.searchParams.get('token');
        if (token) {
          authResponse = { token };
          logStep("Auth token generated for auto-login", { email: customerEmail });
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      userId,
      email: customerEmail,
      auth: authResponse,
      subscription: session.subscription ? {
        id: typeof session.subscription === 'string' ? session.subscription : session.subscription.id,
        status: typeof session.subscription === 'object' ? session.subscription.status : 'active'
      } : null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});