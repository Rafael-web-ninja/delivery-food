import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-STRIPE-PRICES] ${step}${detailsStr}`);
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

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get prices for both products
    const productIds = ["prod_SrUoyAbRcb6Qg8", "prod_SrUpK1iT4fKXq7"];
    const pricesData = [];

    for (const productId of productIds) {
      logStep("Fetching prices for product", { productId });
      
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 10,
      });

      if (prices.data.length > 0) {
        const price = prices.data[0]; // Get the first active price
        const product = await stripe.products.retrieve(productId);
        
        pricesData.push({
          productId,
          productName: product.name,
          priceId: price.id,
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval || 'one_time',
          intervalCount: price.recurring?.interval_count || 1,
          formattedPrice: `${price.currency.toUpperCase()} ${(price.unit_amount! / 100).toFixed(2)}`
        });
        
        logStep("Price found", { 
          productId, 
          amount: price.unit_amount, 
          currency: price.currency 
        });
      } else {
        logStep("No active prices found for product", { productId });
      }
    }

    return new Response(JSON.stringify({ prices: pricesData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in get-stripe-prices", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});