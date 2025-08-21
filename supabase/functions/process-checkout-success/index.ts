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

    // Check if user already exists
    let userId;
    let userExists = false;
    
    try {
      const { data: existingUserData, error: userError } = await supabaseClient.auth.admin.getUserByEmail(customerEmail);
      
      if (existingUserData?.user && !userError) {
        userId = existingUserData.user.id;
        userExists = true;
        logStep("Existing user found", { userId });
      }
    } catch (checkError) {
      logStep("Error checking existing user", { error: checkError });
    }

    if (!userExists) {
      // Create new user for guest checkout
      logStep("Creating new user for guest checkout", { email: customerEmail });
      
      // Generate random password for the user
      const randomPassword = generateRandomPassword();
      logStep("Generated random password", { email: customerEmail });
      
      const { data: newUserData, error: createError } = await supabaseClient.auth.admin.createUser({
        email: customerEmail,
        password: randomPassword,
        email_confirm: true, // Auto-confirm email since they completed payment
        user_metadata: {
          subscription_created: true,
          created_via_checkout: true
        }
      });

      if (createError || !newUserData?.user) {
        logStep("Failed to create user", { error: createError });
        throw new Error(`Failed to create user: ${createError?.message}`);
      }

      userId = newUserData.user.id;
      logStep("New user created successfully", { userId, email: customerEmail });

      // Send welcome email with password
      try {
        logStep("Sending welcome email with password", { email: customerEmail });
        const { data: emailData, error: emailError } = await supabaseClient.functions.invoke('send-welcome-email', {
          body: { 
            email: customerEmail, 
            password: randomPassword,
            userId: userId 
          }
        });

        if (emailError) {
          logStep("Failed to send welcome email", { error: emailError });
        } else {
          logStep("Welcome email sent successfully", { email: customerEmail });
        }
      } catch (emailError) {
        logStep("Error sending welcome email", { error: emailError });
      }

      // Verify the user is available via getUserByEmail (retry to avoid eventual consistency issues)
      for (let attempt = 1; attempt <= 5; attempt++) {
        await sleep(300);
        try {
          const { data: verifyData, error: verifyError } = await supabaseClient.auth.admin.getUserByEmail(customerEmail);
          if (verifyData?.user && !verifyError) {
            logStep("Verified user exists after creation", { attempt });
            break;
          }
          logStep("Retrying user verification", { attempt });
        } catch (verifyError) {
          logStep("User verification attempt failed", { attempt, error: verifyError });
        }
      }
    }

    // Update subscription data in database
    if (session.subscription) {
      const subscription = typeof session.subscription === 'object' ? session.subscription : null;
      if (subscription) {
        const planType = session.metadata?.plan_type || 'mensal';
        
        logStep("Updating subscriber_plans", { userId, planType });
        
        // Upsert subscriber_plans record
        const { error: upsertError } = await supabaseClient
          .from('subscriber_plans')
          .upsert({
            user_id: userId,
            email: customerEmail,
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

        logStep("Subscription data updated successfully", { userId, planType, status: subscription.status });
      }
    }

    // Generate password reset link for new users
    let authResponse = null;
    if (!userExists) {
      logStep("Generating password reset link for new user", { email: customerEmail });

      // Build a reliable base URL
      const originHeader = req.headers.get("origin");
      let baseUrl = originHeader || null;
      if (!baseUrl) {
        const ref = req.headers.get("referer");
        if (ref) {
          try {
            const u = new URL(ref);
            baseUrl = `${u.protocol}//${u.host}`;
          } catch (_) {
            logStep("Could not parse referer", { referer: ref });
          }
        }
      }
      if (!baseUrl) baseUrl = "http://localhost:3000";
      
      logStep("Using base URL", { baseUrl });

      // Retry token generation to avoid race condition right after user creation
      let tokenData = null as any;
      let tokenError = null as any;
      for (let attempt = 1; attempt <= 5; attempt++) {
        await sleep(500);
        
        try {
          const resp = await supabaseClient.auth.admin.generateLink({
            type: 'recovery',
            email: customerEmail,
            options: {
              redirectTo: `${baseUrl}/reset-password`
            }
          });
          tokenData = resp.data;
          tokenError = resp.error;

          if (!tokenError && tokenData?.properties?.action_link) {
            logStep("Password reset link generated successfully", { attempt });
            break;
          }
        } catch (linkError) {
          tokenError = linkError;
        }

        logStep("Retrying password reset link generation", { attempt, error: tokenError?.message });
      }

      if (!tokenError && tokenData?.properties?.action_link) {
        // Extract the token from the action_link
        const url = new URL(tokenData.properties.action_link);
        const token = url.searchParams.get('token');
        const refresh_token = url.searchParams.get('refresh_token');
        
        if (token) {
          const redirectUrl = `${baseUrl}/reset-password?token=${token}&refresh_token=${refresh_token}&email=${encodeURIComponent(customerEmail)}&type=recovery`;
          authResponse = { 
            token, 
            refresh_token,
            type: 'recovery',
            redirectTo: redirectUrl
          };
          logStep("Password reset link prepared", { 
            email: customerEmail, 
            hasToken: !!token, 
            redirectTo: redirectUrl 
          });
        }
      } else {
        logStep("Failed to generate password reset link after retries", { error: tokenError });
      }
    }

    const response = { 
      success: true, 
      userId,
      email: customerEmail,
      auth: authResponse,
      subscription: session.subscription ? {
        id: typeof session.subscription === 'string' ? session.subscription : session.subscription.id,
        status: typeof session.subscription === 'object' ? session.subscription.status : 'active'
      } : null
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