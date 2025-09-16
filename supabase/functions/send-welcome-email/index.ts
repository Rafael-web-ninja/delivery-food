import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { WelcomeEmail } from "./_templates/welcome-email.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  customerName: string;
  customerEmail: string;
  tempPassword: string;
  planType: string;
  amount: number;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-WELCOME-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Welcome email function started");

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      logStep("ERROR: RESEND_API_KEY not configured");
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);

    const { 
      customerName, 
      customerEmail, 
      tempPassword, 
      planType, 
      amount 
    }: WelcomeEmailRequest = await req.json();

    logStep("Processing welcome email", { 
      customerName, 
      customerEmail, 
      planType, 
      amount,
      hasPassword: !!tempPassword
    });

    if (!customerName || !customerEmail || !tempPassword) {
      throw new Error("Missing required fields: customerName, customerEmail, or tempPassword");
    }

    // Generate login URL
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || 'https://app.geracardapio.com';
    const loginUrl = `${baseUrl}/auth?welcome=true`;

    // Render the email template
    const html = await renderAsync(
      React.createElement(WelcomeEmail, {
        customerName,
        customerEmail,
        tempPassword,
        loginUrl,
        businessName: "GeraCardápio",
        planType,
        amount: amount || 0
      })
    );

    logStep("Email template rendered successfully");

    // Send the email
    const emailResponse = await resend.emails.send({
      from: "GeraCardápio <noreply@geracardapio.com>",
      to: [customerEmail],
      subject: `🎉 Pagamento Confirmado! Suas credenciais de acesso - ${planType}`,
      html,
    });

    logStep("Email sent successfully", { 
      emailId: emailResponse.data?.id,
      recipient: customerEmail
    });

    return new Response(JSON.stringify({
      success: true,
      emailId: emailResponse.data?.id,
      message: "Welcome email sent successfully"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    logStep("ERROR in send-welcome-email function", { 
      error: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: "Failed to send welcome email"
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json", 
        ...corsHeaders 
      },
    });
  }
});