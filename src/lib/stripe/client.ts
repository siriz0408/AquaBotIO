import Stripe from "stripe";

/**
 * Stripe client initialization
 *
 * Uses the secret key for server-side operations.
 * Never expose this key to the client.
 */

let _stripe: Stripe | null = null;

/**
 * Get Stripe client (lazy initialization)
 * This allows the module to be imported at build time without errors
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set. Stripe features will not work.");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // Using SDK default API version
      typescript: true,
    });
  }
  return _stripe;
}

/**
 * @deprecated Use getStripe() instead for lazy initialization
 */
export const stripe = {
  get checkout() { return getStripe().checkout; },
  get customers() { return getStripe().customers; },
  get subscriptions() { return getStripe().subscriptions; },
  get billingPortal() { return getStripe().billingPortal; },
  get webhooks() { return getStripe().webhooks; },
} as Stripe;

/**
 * Product IDs for subscription tiers
 */
export const STRIPE_PRODUCTS = {
  starter: process.env.STRIPE_PRODUCT_STARTER || "",
  plus: process.env.STRIPE_PRODUCT_PLUS || "",
  pro: process.env.STRIPE_PRODUCT_PRO || "",
} as const;

/**
 * Price IDs for monthly subscriptions (per Spec 18)
 * Prices: Starter $4.99, Plus $9.99, Pro $19.99
 */
export const STRIPE_PRICES = {
  starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || "",
  plus_monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY || "",
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
  // Annual prices (created but not exposed in UI until post-launch per Spec 18)
  starter_annual: process.env.STRIPE_PRICE_STARTER_ANNUAL || "",
  plus_annual: process.env.STRIPE_PRICE_PLUS_ANNUAL || "",
  pro_annual: process.env.STRIPE_PRICE_PRO_ANNUAL || "",
} as const;

/**
 * Customer portal configuration ID
 */
export const STRIPE_PORTAL_CONFIG_ID = process.env.STRIPE_PORTAL_CONFIG_ID || "";

/**
 * Billing interval type
 */
export type BillingInterval = "monthly" | "annual";

/**
 * Subscription tier type
 */
export type SubscriptionTier = "starter" | "plus" | "pro";

/**
 * Map tier names to price IDs
 * @param tier - The subscription tier
 * @param interval - Billing interval (default: monthly)
 */
export function getPriceIdForTier(
  tier: SubscriptionTier,
  interval: BillingInterval = "monthly"
): string {
  const priceMap: Record<SubscriptionTier, Record<BillingInterval, string>> = {
    starter: {
      monthly: STRIPE_PRICES.starter_monthly,
      annual: STRIPE_PRICES.starter_annual,
    },
    plus: {
      monthly: STRIPE_PRICES.plus_monthly,
      annual: STRIPE_PRICES.plus_annual,
    },
    pro: {
      monthly: STRIPE_PRICES.pro_monthly,
      annual: STRIPE_PRICES.pro_annual,
    },
  };
  return priceMap[tier][interval];
}

/**
 * Map price IDs to tier names
 * Handles both monthly and annual price IDs
 */
export function getTierForPriceId(priceId: string): SubscriptionTier | null {
  // Check monthly prices
  if (priceId === STRIPE_PRICES.starter_monthly || priceId === STRIPE_PRICES.starter_annual) {
    return "starter";
  }
  if (priceId === STRIPE_PRICES.plus_monthly || priceId === STRIPE_PRICES.plus_annual) {
    return "plus";
  }
  if (priceId === STRIPE_PRICES.pro_monthly || priceId === STRIPE_PRICES.pro_annual) {
    return "pro";
  }
  return null;
}

/**
 * Get billing interval from price ID
 */
export function getBillingIntervalForPriceId(priceId: string): BillingInterval | null {
  if (
    priceId === STRIPE_PRICES.starter_monthly ||
    priceId === STRIPE_PRICES.plus_monthly ||
    priceId === STRIPE_PRICES.pro_monthly
  ) {
    return "monthly";
  }
  if (
    priceId === STRIPE_PRICES.starter_annual ||
    priceId === STRIPE_PRICES.plus_annual ||
    priceId === STRIPE_PRICES.pro_annual
  ) {
    return "annual";
  }
  return null;
}

/**
 * Tier display prices (per Spec 18)
 */
export const TIER_DISPLAY_PRICES = {
  starter: {
    monthly: "$4.99/mo",
    annual: "$49.90/yr", // ~$4.16/mo, 16.5% savings
  },
  plus: {
    monthly: "$9.99/mo",
    annual: "$99.90/yr", // ~$8.33/mo, 16.5% savings
  },
  pro: {
    monthly: "$19.99/mo",
    annual: "$199.90/yr", // ~$16.66/mo, 16.5% savings
  },
} as const;
