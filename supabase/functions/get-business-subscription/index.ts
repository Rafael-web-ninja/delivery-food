import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Out =
  | { ok: true; allow: boolean; status: "active" | "trialing" | "grace" | "inactive"; reason?: string; expires_at?: string | null }
  | { ok: false; allow: boolean; status: "unknown"; reason: string };

const GRACE_DAYS = 3;

function allowFromFlags(
  isActive?: boolean | null,
  status?: string | null,
  expires_at?: string | null,
  plan_type?: string | null,
) {
  const now = new Date();
  const exp = expires_at ? new Date(expires_at) : null;
  const inGrace = exp ? (now.getTime() - exp.getTime()) <= GRACE_DAYS * 86400000 : false;

  if (status === "active" || status === "trialing") return { allow: true, tag: status as "active" | "trialing" };
  if (inGrace) return { allow: true, tag: "grace" as const };
  if (plan_type === "free") return { allow: true, tag: "grace" as const };
  if (isActive) return { allow: true, tag: "grace" as const }; // fallback pró-venda
  return { allow: false, tag: "inactive" as const };
}

const log = (msg: string, details?: unknown) => {
  console.log(`[GET-BUSINESS-SUBSCRIPTION] ${msg}${details ? " - " + JSON.stringify(details) : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({} as any));
    const ownerIdIn = body.ownerId as string | undefined;
    const businessIdIn = body.businessId as string | undefined;
    const slugIn = body.slug as string | undefined;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      log("Missing env, degrading gracefully");
      const out: Out = { ok: false, allow: true, status: "unknown", reason: "temporary_error" };
      return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    // Resolve business and owner
    let businessId: string | undefined = businessIdIn;
    let ownerId: string | undefined = ownerIdIn;
    let isActive: boolean | undefined = undefined;

    if (!businessId) {
      // Try resolve by slug or owner
      let q = supabase.from("delivery_businesses").select("id, owner_id, is_active").limit(1);
      if (slugIn) q = q.eq("slug", slugIn);
      else if (ownerIdIn) q = q.eq("owner_id", ownerIdIn);
      const { data: bizByOther, error: bizErr } = await q.maybeSingle();
      if (bizErr) log("Error fetching business", { error: bizErr.message });
      if (bizByOther) {
        businessId = bizByOther.id as string;
        ownerId = ownerId || (bizByOther.owner_id as string);
        isActive = (bizByOther.is_active as boolean) ?? undefined;
      }
    }

    if (businessId) {
      const { data: biz, error: bizErr } = await supabase
        .from("delivery_businesses")
        .select("id, owner_id, is_active")
        .eq("id", businessId)
        .maybeSingle();
      if (bizErr) log("Business fetch error", { error: bizErr.message });
      if (biz) {
        ownerId = ownerId || (biz.owner_id as string);
        isActive = (biz.is_active as boolean) ?? isActive;
      }
    }

    if (!ownerId) {
      log("Owner not resolved, degrading");
      const out: Out = { ok: false, allow: true, status: "unknown", reason: "temporary_error" };
      return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    const { data: plan, error: planErr } = await supabase
      .from("subscriber_plans")
      .select("subscription_status, subscription_end, updated_at, plan_type")
      .eq("user_id", ownerId)
      .order("updated_at", { ascending: false })
      .maybeSingle();

    if (planErr) {
      log("Plan fetch error", { error: planErr.message });
    }

    const { allow, tag } = allowFromFlags(isActive, plan?.subscription_status ?? null, plan?.subscription_end ?? null, plan?.plan_type ?? null);

    const out: Out = { ok: true, allow, status: tag, expires_at: plan?.subscription_end ?? null };
    log("Computed allow", { out });
    return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (e) {
    log("Unhandled exception, degrading", { message: e instanceof Error ? e.message : String(e) });
    const out: Out = { ok: false, allow: true, status: "unknown", reason: "temporary_error" };
    return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  }
});
