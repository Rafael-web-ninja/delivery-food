import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (msg: string, details?: unknown) => {
  console.log(`[GET-BUSINESS-SUBSCRIPTION] ${msg}${details ? " - " + JSON.stringify(details) : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase env variables");

    // Use service role key to bypass RLS for public subscription checking
    const supabase = createClient(supabaseUrl, serviceKey, { 
      auth: { persistSession: false, autoRefreshToken: false } 
    });

    const body = await req.json().catch(() => ({}));
    const ownerId: string | undefined = body.ownerId;
    const businessId: string | undefined = body.businessId;
    const slug: string | undefined = body.slug;

    log("Function started", { hasOwnerId: !!ownerId, hasBusinessId: !!businessId, hasSlug: !!slug });

    let resolvedOwnerId = ownerId;

    if (!resolvedOwnerId) {
      // Resolve owner id from business id or slug
      let query = supabase
        .from("delivery_businesses")
        .select("owner_id, id, is_active")
        .limit(1);

      if (businessId) query = query.eq("id", businessId);
      else if (slug) query = query.eq("slug", slug);

      const { data: biz, error: bizErr } = await query.maybeSingle();
      if (bizErr) {
        log("Error fetching business", { error: bizErr.message });
        return new Response(JSON.stringify({ active: false, reason: "business_error" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      if (!biz) {
        log("Business not found");
        return new Response(JSON.stringify({ active: false, reason: "business_not_found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      resolvedOwnerId = biz.owner_id as string;
    }

    if (!resolvedOwnerId) {
      log("Owner id not resolved");
      return new Response(JSON.stringify({ active: false, reason: "owner_not_found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: plan, error: planErr } = await supabase
      .from("subscriber_plans")
      .select("subscription_status, subscription_end, updated_at, plan_type")
      .eq("user_id", resolvedOwnerId)
      .order("updated_at", { ascending: false })
      .maybeSingle();

    if (planErr) {
      log("Error fetching plan", { error: planErr.message });
      return new Response(JSON.stringify({ active: false, reason: "plan_error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    log("Found plan", { plan });

    let active = false;
    if (plan && plan.subscription_status === "active") {
      if (plan.subscription_end) {
        const endDate = new Date(plan.subscription_end);
        const now = new Date();
        active = endDate > now;
        log("Subscription has end date", { endDate: endDate.toISOString(), now: now.toISOString(), active });
      } else {
        active = true;
        log("Subscription has no end date, marking as active");
      }
    } else {
      log("Plan not active", { status: plan?.subscription_status || "no_plan" });
    }

    log("Final computed active status", { active, ownerId: resolvedOwnerId });
    return new Response(JSON.stringify({ active, debug: { plan, ownerId: resolvedOwnerId } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    log("Unhandled error", { message });
    return new Response(JSON.stringify({ active: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
