import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Map Stripe product IDs to plan names
const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_TqyiHr4viOTKdk": "pro",
  "prod_TqyiDzOJJ3QPv2": "premium",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found, user is on free plan");
      return new Response(JSON.stringify({ 
        subscribed: false, 
        plan: "free",
        product_id: null,
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions first
    const activeSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    // Also check for canceled subscriptions (still active until period end)
    const canceledSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "canceled",
      limit: 1,
    });

    const hasActiveSub = activeSubscriptions.data.length > 0;
    const hasCanceledSub = canceledSubscriptions.data.length > 0 && 
      canceledSubscriptions.data[0].current_period_end * 1000 > Date.now();

    let productId: string | null = null;
    let plan = "free";
    let subscriptionEnd: string | null = null;
    let stripeSubscriptionId: string | null = null;
    let status: "active" | "canceled" | "expired" = "active";
    let canceledAt: string | null = null;

    if (hasActiveSub) {
      const subscription = activeSubscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      stripeSubscriptionId = subscription.id;
      productId = subscription.items.data[0].price.product as string;
      plan = PRODUCT_TO_PLAN[productId] || "pro";
      status = "active";
      logStep("Active subscription found", { subscriptionId: subscription.id, plan, endDate: subscriptionEnd });

      // Update subscription in database
      const { error: updateError } = await supabaseClient
        .from("subscriptions")
        .update({
          plan: plan,
          status: "active",
          stripe_customer_id: customerId,
          stripe_subscription_id: stripeSubscriptionId,
          current_period_end: subscriptionEnd,
        })
        .eq("user_id", user.id);

      if (updateError) {
        logStep("Error updating subscription in DB", { error: updateError.message });
      } else {
        logStep("Subscription updated in DB");
      }
    } else if (hasCanceledSub) {
      // User has canceled but still has access until period end
      const subscription = canceledSubscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      stripeSubscriptionId = subscription.id;
      productId = subscription.items.data[0].price.product as string;
      plan = PRODUCT_TO_PLAN[productId] || "pro";
      status = "canceled";
      canceledAt = subscription.canceled_at 
        ? new Date(subscription.canceled_at * 1000).toISOString() 
        : null;
      logStep("Canceled subscription found (still active)", { 
        subscriptionId: subscription.id, 
        plan, 
        endDate: subscriptionEnd,
        canceledAt 
      });

      // Update subscription in database with canceled status
      const { error: updateError } = await supabaseClient
        .from("subscriptions")
        .update({
          plan: plan,
          status: "canceled",
          stripe_customer_id: customerId,
          stripe_subscription_id: stripeSubscriptionId,
          current_period_end: subscriptionEnd,
        })
        .eq("user_id", user.id);

      if (updateError) {
        logStep("Error updating canceled subscription in DB", { error: updateError.message });
      } else {
        logStep("Canceled subscription updated in DB");
      }
    } else {
      logStep("No active or valid canceled subscription found");
      
      // Update to free plan in database
      await supabaseClient
        .from("subscriptions")
        .update({
          plan: "free",
          status: "active",
          stripe_customer_id: customerId,
          stripe_subscription_id: null,
          current_period_end: null,
        })
        .eq("user_id", user.id);
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub || hasCanceledSub,
      plan,
      status,
      product_id: productId,
      subscription_end: subscriptionEnd,
      stripe_customer_id: customerId,
      canceled_at: canceledAt,
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
