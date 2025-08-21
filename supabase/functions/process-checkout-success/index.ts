import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";
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
        // Check if user already exists - be more comprehensive in error detection
        const errorMessage = createUserError.message?.toLowerCase() || '';
        const isUserExistsError = errorMessage.includes('email_address_not_unique') || 
            errorMessage.includes('email_exists') ||
            errorMessage.includes('user already registered') ||
            errorMessage.includes('already been registered') ||
            errorMessage.includes('email address has already been registered') ||
            createUserError.status === 422;
        
        if (isUserExistsError) {
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

          // Send recovery link for existing users
          try {
            const resendKey = Deno.env.get("RESEND_API_KEY");
            if (resendKey) {
              const resend = new Resend(resendKey);
              logStep("Sending recovery link for existing user", { email: customerEmail });
              
              const { data: recoveryData, error: recoveryError } = await supabaseClient.auth.admin.generateLink({
                type: 'recovery',
                email: customerEmail,
                options: {
                  redirectTo: `${req.headers.get("origin") || "https://preview--app-gera-cardapio.lovable.app"}/auth`
                }
              });

              if (recoveryError) {
                logStep("Recovery link generation failed for existing user", { error: recoveryError.message });
              } else if (recoveryData.properties?.action_link) {
                const recoveryEmailResponse = await resend.emails.send({
                  from: "Gera Cardápio <onboarding@resend.dev>",
                  to: [customerEmail],
                  subject: "Sua assinatura foi ativada - Gera Cardápio",
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                      <h1 style="color: #2563eb; margin-bottom: 20px;">Assinatura Ativada!</h1>
                      <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Sua assinatura do Gera Cardápio foi ativada com sucesso!</p>
                      <p style="font-size: 14px; line-height: 1.5; margin-bottom: 20px;">Clique no link abaixo para acessar sua conta:</p>
                      <div style="margin: 30px 0; text-align: center;">
                        <a href="${recoveryData.properties.action_link}" 
                           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                           Acessar Minha Conta
                        </a>
                      </div>
                      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Este link expira em 24 horas.</p>
                    </div>
                  `,
                });

                if (recoveryEmailResponse.data?.id) {
                  emailSent = true;
                  logStep("Recovery email sent successfully for existing user", { emailId: recoveryEmailResponse.data.id });
                } else {
                  logStep("Recovery email send failed for existing user");
                }
              }
            }
          } catch (existingUserEmailError) {
            logStep("Failed to send recovery link for existing user (non-critical)", { 
              error: existingUserEmailError instanceof Error ? existingUserEmailError.message : String(existingUserEmailError)
            });
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

        // Send welcome email with password (non-blocking)
        try {
          const resendKey = Deno.env.get("RESEND_API_KEY");
          if (!resendKey) {
            logStep("RESEND_API_KEY missing - email not sent");
          } else {
            const resend = new Resend(resendKey);
            logStep("Sending welcome email with password", { email: customerEmail });
            
            try {
              const emailResponse = await resend.emails.send({
                from: "Gera Cardápio <onboarding@resend.dev>",
                to: [customerEmail],
                subject: "Bem-vindo! Sua assinatura foi ativada",
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #2563eb; margin-bottom: 20px;">Bem-vindo ao Gera Cardápio!</h1>
                    <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Sua assinatura foi ativada com sucesso!</p>
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h2 style="color: #1e293b; margin-bottom: 15px;">Dados de Acesso:</h2>
                      <p style="margin: 10px 0;"><strong>Email:</strong> ${customerEmail}</p>
                      <p style="margin: 10px 0;"><strong>Senha temporária:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${randomPassword}</code></p>
                    </div>
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                      <p style="margin: 0; color: #92400e;"><strong>Importante:</strong> Altere sua senha após o primeiro login por segurança.</p>
                    </div>
                    <div style="margin: 30px 0;">
                      <a href="${req.headers.get("origin") || "https://preview--app-gera-cardapio.lovable.app"}/auth" 
                         style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                         Fazer Login Agora
                      </a>
                    </div>
                    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Se você não solicitou esta assinatura, ignore este email.</p>
                  </div>
                `,
              });
              
              if (emailResponse.data?.id) {
                emailSent = true;
                logStep("Password email sent successfully", { emailId: emailResponse.data.id });
              } else {
                logStep("Password email send failed - no response ID, trying recovery link");
                throw new Error("No email response ID");
              }
            } catch (passwordEmailError) {
              logStep("Password email failed, sending recovery link", { 
                error: passwordEmailError instanceof Error ? passwordEmailError.message : String(passwordEmailError)
              });
              
              // Fallback: Send recovery link
              try {
                const { data: recoveryData, error: recoveryError } = await supabaseClient.auth.admin.generateLink({
                  type: 'recovery',
                  email: customerEmail,
                  options: {
                    redirectTo: `${req.headers.get("origin") || "https://preview--app-gera-cardapio.lovable.app"}/auth`
                  }
                });

                if (recoveryError) {
                  logStep("Recovery link generation failed", { error: recoveryError.message });
                } else if (recoveryData.properties?.action_link) {
                  logStep("Recovery link generated successfully, sending email");
                  
                  const recoveryEmailResponse = await resend.emails.send({
                    from: "Gera Cardápio <onboarding@resend.dev>",
                    to: [customerEmail],
                    subject: "Defina sua senha - Gera Cardápio",
                    html: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1 style="color: #2563eb; margin-bottom: 20px;">Bem-vindo ao Gera Cardápio!</h1>
                        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Sua assinatura foi ativada com sucesso!</p>
                        <p style="font-size: 14px; line-height: 1.5; margin-bottom: 20px;">Clique no link abaixo para definir sua senha e acessar sua conta:</p>
                        <div style="margin: 30px 0; text-align: center;">
                          <a href="${recoveryData.properties.action_link}" 
                             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                             Definir Senha e Fazer Login
                          </a>
                        </div>
                        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Este link expira em 24 horas. Se você não solicitou esta assinatura, ignore este email.</p>
                      </div>
                    `,
                  });

                  if (recoveryEmailResponse.data?.id) {
                    emailSent = true;
                    logStep("Recovery email sent successfully", { emailId: recoveryEmailResponse.data.id });
                  } else {
                    logStep("Recovery email send failed - no response ID");
                  }
                }
              } catch (recoveryLinkError) {
                logStep("Recovery link process failed", { 
                  error: recoveryLinkError instanceof Error ? recoveryLinkError.message : String(recoveryLinkError)
                });
              }
            }
          }
        } catch (emailError) {
          logStep("Email process error (non-critical)", { 
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