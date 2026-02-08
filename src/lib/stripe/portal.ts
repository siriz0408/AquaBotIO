import { stripe, STRIPE_PORTAL_CONFIG_ID } from "./client";

/**
 * Customer portal helpers
 */

interface CreatePortalSessionParams {
  customerId: string;
  returnUrl: string;
}

/**
 * Create a Stripe Customer Portal session
 *
 * The portal allows customers to:
 * - Update payment methods
 * - View invoice history
 * - Cancel subscription
 * - Change plan
 */
export async function createPortalSession({
  customerId,
  returnUrl,
}: CreatePortalSessionParams) {
  const sessionParams: Parameters<typeof stripe.billingPortal.sessions.create>[0] = {
    customer: customerId,
    return_url: returnUrl,
  };

  // Use portal configuration if available
  if (STRIPE_PORTAL_CONFIG_ID) {
    sessionParams.configuration = STRIPE_PORTAL_CONFIG_ID;
  }

  const session = await stripe.billingPortal.sessions.create(sessionParams);

  return session;
}

/**
 * Get customer's active subscription
 */
export async function getCustomerSubscription(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
    expand: ["data.default_payment_method"],
  });

  return subscriptions.data[0] || null;
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscriptionAtPeriodEnd(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  return subscription;
}

/**
 * Resume a subscription that was set to cancel
 */
export async function resumeSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  return subscription;
}
