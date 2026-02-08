import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  handleCheckoutCompleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
} from "@/lib/stripe/webhook-handlers";
import type { Database } from "@/types/database";

// Get Stripe client lazily to avoid build-time initialization errors
function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });
}

// Create Supabase admin client
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
 * POST /api/webhooks/stripe
 *
 * Handle Stripe webhook events.
 * Verifies signature and processes events idempotently.
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.error("Missing Stripe signature");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const stripe = getStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Check for duplicate event (idempotency)
    const supabase = getAdminClient();
    const { data: existingEvent } = await supabase
      .from("webhook_events")
      .select("id")
      .eq("event_id", event.id)
      .single();

    if (existingEvent) {
      // Already processed this event
      console.log(`Webhook event ${event.id} already processed`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Process the event
    let result: { success: boolean; error?: string } = { success: true };

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        result = await handleCheckoutCompleted(session);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        result = await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        result = await handleInvoicePaymentFailed(invoice);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        result = await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        result = await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        // Log unhandled events but don't fail
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    // Store event for idempotency tracking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("webhook_events") as any).insert({
      event_id: event.id,
      event_type: event.type,
      payload: event.data.object as unknown as Record<string, unknown>,
      error: result.success ? null : result.error,
    });

    if (!result.success) {
      console.error(`Webhook handler failed for ${event.type}:`, result.error);
      // Still return 200 to acknowledge receipt
      // Stripe will retry on 5xx, but we've stored the error for investigation
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Return 500 to trigger Stripe retry
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Note: In App Router, request.text() provides raw body for signature verification
// No additional config needed (unlike Pages Router which required bodyParser: false)
