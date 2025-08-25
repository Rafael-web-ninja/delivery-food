import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://app.geracardapio.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Secure function by validating origin and Stripe signature
const ALLOWED_ORIGINS = [
  "https://app.geracardapio.com",
  "https://preview--app-gera-cardapio.lovable.app"
];

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-CHECKOUT-SUCCESS] ${step}${detailsStr}`);
};

// Small helper for retries (helps with eventual consistency on Auth APIs)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Generate random password
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Validate origin for security
    const origin = req.headers.get("origin");
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      logStep("ERROR: Unauthorized origin", { origin });
      return new Response(JSON.stringify({ error: "Unauthorized origin" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Use SERVICE ROLE key for admin operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY is not set");
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    logStep("Stripe key verified");

    const body = await req.json();
    logStep("Request body received", body);
    
    const { sessionId } = body;
    if (!sessionId) {
      logStep("ERROR: Session ID is required");
      throw new Error("Session ID is required");
    }
    logStep("Processing session", { sessionId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription']
    });

    logStep("Session retrieved from Stripe", { 
      payment_status: session.payment_status,
      customer_details_email: session.customer_details?.email,
      subscription: session.subscription ? 'present' : 'null'
    });

    if (session.payment_status !== 'paid') {
      logStep("ERROR: Payment not completed", { payment_status: session.payment_status });
      throw new Error("Payment not completed");
    }

    // Try multiple ways to get customer email
    let customerEmail = session.customer_details?.email;
    
    if (!customerEmail && session.customer) {
      // If customer is an object, try to get email from it
      if (typeof session.customer === 'object' && 'email' in session.customer) {
        customerEmail = (session.customer as any).email;
      } else if (typeof session.customer === 'string') {
        // If customer is just an ID, retrieve the customer object
        try {
          const customer = await stripe.customers.retrieve(session.customer);
          if ('email' in customer) {
            customerEmail = customer.email;
          }
        } catch (customerError) {
          logStep("Could not retrieve customer from Stripe", { error: customerError });
        }
      }
    }

    if (!customerEmail) {
      logStep("ERROR: No customer email found", { 
        customer_details: session.customer_details,
        customer: session.customer 
      });
      throw new Error("No customer email found in session or customer record");
    }

    logStep("Customer email found", { email: customerEmail });

    // Try to create user directly (handles existing users via error handling)
    let userId: string = '';
    let isNewUser = false;
    let emailSent = false;
    
    try {
      const randomPassword = generateRandomPassword();
      logStep("Attempting to create user", { email: customerEmail });
      
      const { data: newUserData, error: createUserError } = await supabaseClient.auth.admin.createUser({
        email: customerEmail,
        password: randomPassword,
        email_confirm: true,
        user_metadata: { subscription_created: true }
      });

      if (createUserError) {
        // Check if user already exists
        if (createUserError.message?.includes('email_address_not_unique') || 
            createUserError.message?.includes('email_exists') ||
            createUserError.message?.includes('User already registered')) {
          logStep("User already exists", { email: customerEmail });
          isNewUser = false;
          
          // Try to get existing user ID via listUsers
          try {
            const { data: usersData } = await supabaseClient.auth.admin.listUsers();
            const existingUser = usersData.users.find(u => u.email === customerEmail);
            userId = existingUser?.id || '';
            if (userId) {
              logStep("Found existing user ID", { userId });
            }
          } catch (listError) {
            logStep("Could not retrieve existing user ID (non-critical)", { error: listError });
          }
        } else {
          logStep("Failed to create user", { error: createUserError.message });
          throw new Error(`Failed to create user: ${createUserError.message}`);
        }
      } else if (!newUserData?.user?.id) {
        logStep("User creation returned no ID");
        throw new Error("User creation returned no user ID");
      } else {
        userId = newUserData.user.id;
        isNewUser = true;
        logStep("New user created successfully", { userId, email: customerEmail });

        // Send welcome email with password using secure internal call (non-blocking)
        try {
          logStep("Sending welcome email via internal function", { email: customerEmail });
          
          // Call our secure welcome email function
          const { data: emailResponse, error: emailError } = await supabaseClient.functions.invoke('send-auth-welcome-email', {
            body: {
              email: customerEmail,
              temporaryPassword: randomPassword
            },
            headers: {
              'x-internal-secret': 'gera-cardapio-internal-secret-2024'
            }
          });

          if (emailError) {
            logStep("Error calling welcome email function", { error: emailError });
          } else {
            emailSent = true;
            logStep("Welcome email function called successfully", { 
              email: customerEmail,
              response: emailResponse 
            });
          }
        } catch (emailError) {
          logStep("Email sending error (non-critical)", { 
            error: emailError instanceof Error ? emailError.message : String(emailError) 
          });
        }

        await sleep(500);
        logStep("User creation process completed", { userId, emailSent });
      }
    } catch (error) {
      logStep("Error in user management (continuing with subscription update)", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      // Don't throw - continue with subscription update even if user creation fails
    }

    // Update subscription in Supabase (if session has subscription)
    let subscriptionUpdated = false;
    
    if (session.subscription) {
      try {
        const subscription = typeof session.subscription === 'object' ? session.subscription : null;
        if (subscription) {
          const planType = session.metadata?.plan_type || 'mensal';
          
          logStep("Updating subscription in database", { 
            userId, 
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status 
          });

          const { error: upsertError } = await supabaseClient
            .from('subscriber_plans')
            .upsert({
              user_id: userId || null,
              email: customerEmail,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              plan_type: planType,
              subscription_status: subscription.status,
              subscription_start: new Date(subscription.current_period_start * 1000).toISOString(),
              subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'email'
            });

          if (upsertError) {
            logStep("Subscription update failed (non-critical)", { error: upsertError });
          } else {
            subscriptionUpdated = true;
            logStep("Subscription updated successfully in database");
          }
        }
      } catch (subscriptionError) {
        logStep("Subscription update error (non-critical)", { 
          error: subscriptionError instanceof Error ? subscriptionError.message : String(subscriptionError)
        });
      }
    }

    logStep("Process completed", { 
      userId, 
      email: customerEmail, 
      isNewUser,
      emailSent,
      subscriptionUpdated,
      hasSubscription: !!session.subscription 
    });

    const response = { 
      success: true,
      userId,
      email: customerEmail,
      isNewUser,
      emailSent,
      subscriptionUpdated,
      hasSubscription: !!session.subscription
    };

    logStep("Function completed successfully", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});