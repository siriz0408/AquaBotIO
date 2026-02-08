import Stripe from "stripe";
import { stripe, getPriceIdForTier } from "./client";

/**
 * Checkout session helpers
 */

interface CreateCheckoutParams {
  userId: string;
  email: string;
  tier: "starter" | "plus" | "pro";
  stripeCustomerId?: string | null;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession({
  userId,
  email,
  tier,
  stripeCustomerId,
  successUrl,
  cancelUrl,
}: CreateCheckoutParams) {
  const priceId = getPriceIdForTier(tier);

  if (!priceId) {
    throw new Error(`No price ID configured for tier: ${tier}`);
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      user_id: userId,
      tier,
    },
    subscription_data: {
      metadata: {
        user_id: userId,
        tier,
      },
    },
    // Enable automatic tax calculation
    automatic_tax: { enabled: true },
    // Allow promotion codes
    allow_promotion_codes: true,
    // Customer handling
    customer: stripeCustomerId || undefined,
    customer_email: stripeCustomerId ? undefined : email,
    customer_creation: stripeCustomerId ? undefined : "always",
  };

  const session = await stripe.checkout.sessions.create(sessionParams);

  return session;
}

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  // Search for existing customer by email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const customer = existingCustomers.data[0];

    // Update metadata if needed
    if (!customer.metadata?.user_id) {
      await stripe.customers.update(customer.id, {
        metadata: { user_id: userId },
      });
    }

    return customer.id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      user_id: userId,
    },
  });

  return customer.id;
}
