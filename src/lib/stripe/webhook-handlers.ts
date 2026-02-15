/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getTierForPriceId } from "./client";
import type { Database } from "@/types/database";
import {
  sendWelcomeEmail,
  sendPaymentFailedEmail,
  sendCancellationEmail,
} from "@/lib/email/transactional";

/**
 * Webhook event handlers for Stripe events
 *
 * Each handler is responsible for:
 * 1. Extracting relevant data from the event
 * 2. Updating the database accordingly
 * 3. Triggering any side effects (emails, etc.)
 */

// Create Supabase admin client for webhook handlers
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Handle checkout.session.completed
 *
 * Fired when a customer completes a checkout session.
 * Creates/updates the subscription in our database.
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  const supabase = getAdminClient();

  const userId = session.metadata?.user_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId) {
    console.error("No user_id in checkout session metadata");
    return { success: false, error: "Missing user_id" };
  }

  // Update user's Stripe customer ID
  await (supabase
    .from("users") as any)
    .update({ stripe_customer_id: customerId })
    .eq("id", userId);

  // Get subscription details from Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Determine tier from price ID
  const priceId = subscription.items.data[0]?.price.id;
  const tier = getTierForPriceId(priceId || "") || "starter";

  // Update subscription in database
  const { error } = await (supabase
    .from("subscriptions") as any)
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId,
        tier,
        status: subscription.status as "active" | "trialing" | "past_due" | "canceled" | "incomplete",
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        trial_ends_at: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

  if (error) {
    console.error("Error updating subscription:", error);
    return { success: false, error: error.message };
  }

  // Send welcome email
  try {
    const { data: userData } = await (supabase
      .from("users") as any)
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (userData?.email) {
      await sendWelcomeEmail(userData.email, userData.full_name, tier);
    }
  } catch (emailError) {
    // Non-fatal, log and continue
    console.error("Error sending welcome email:", emailError);
  }

  return { success: true };
}

/**
 * Handle invoice.paid
 *
 * Fired when an invoice is successfully paid.
 * Updates the subscription period.
 */
export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const supabase = getAdminClient();

  const subscriptionId = invoice.subscription as string;
  const customerId = invoice.customer as string;

  if (!subscriptionId) {
    // One-time payment, not a subscription
    return { success: true };
  }

  // Get subscription from Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Update subscription period in database
  const { error } = await (supabase
    .from("subscriptions") as any)
    .update({
      status: "active",
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      grace_period_ends_at: null, // Clear grace period
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("Error updating subscription after payment:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Handle invoice.payment_failed
 *
 * Fired when a subscription payment fails.
 * Starts grace period and sends notification.
 */
export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = getAdminClient();

  const customerId = invoice.customer as string;

  // Set 7-day grace period
  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

  const { error } = await (supabase
    .from("subscriptions") as any)
    .update({
      status: "past_due",
      grace_period_ends_at: gracePeriodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("Error updating subscription after payment failure:", error);
    return { success: false, error: error.message };
  }

  // Send payment failed email
  try {
    const { data: subData } = await (supabase
      .from("subscriptions") as any)
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (subData?.user_id) {
      const { data: userData } = await (supabase
        .from("users") as any)
        .select("email, full_name")
        .eq("id", subData.user_id)
        .single();

      if (userData?.email) {
        await sendPaymentFailedEmail(userData.email, userData.full_name);
      }
    }
  } catch (emailError) {
    // Non-fatal, log and continue
    console.error("Error sending payment failed email:", emailError);
  }

  return { success: true };
}

/**
 * Handle customer.subscription.updated
 *
 * Fired when a subscription is changed (plan change, cancel, etc.)
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  const supabase = getAdminClient();

  const customerId = subscription.customer as string;

  // Determine tier from price ID
  const priceId = subscription.items.data[0]?.price.id;
  const tier = getTierForPriceId(priceId || "") || "starter";

  const { error } = await (supabase
    .from("subscriptions") as any)
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      tier,
      status: subscription.status as "active" | "trialing" | "past_due" | "canceled" | "incomplete",
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("Error updating subscription:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Handle customer.subscription.deleted
 *
 * Fired when a subscription is cancelled/expired.
 * Downgrades user to free tier.
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  const supabase = getAdminClient();

  const customerId = subscription.customer as string;

  const { error } = await (supabase
    .from("subscriptions") as any)
    .update({
      tier: "free",
      status: "canceled",
      stripe_subscription_id: null,
      stripe_price_id: null,
      current_period_end: new Date().toISOString(),
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("Error handling subscription deletion:", error);
    return { success: false, error: error.message };
  }

  // Send cancellation email
  try {
    const { data: subData } = await (supabase
      .from("subscriptions") as any)
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (subData?.user_id) {
      const { data: userData } = await (supabase
        .from("users") as any)
        .select("email, full_name")
        .eq("id", subData.user_id)
        .single();

      if (userData?.email) {
        await sendCancellationEmail(userData.email, userData.full_name);
      }
    }
  } catch (emailError) {
    // Non-fatal, log and continue
    console.error("Error sending cancellation email:", emailError);
  }

  return { success: true };
}
