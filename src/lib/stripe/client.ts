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
      apiVersion: "2025-02-24.acacia",
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
 * Price IDs for monthly subscriptions
 */
export const STRIPE_PRICES = {
  starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || "",
  plus_monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY || "",
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
} as const;

/**
 * Customer portal configuration ID
 */
export const STRIPE_PORTAL_CONFIG_ID = process.env.STRIPE_PORTAL_CONFIG_ID || "";

/**
 * Map tier names to price IDs
 */
export function getPriceIdForTier(tier: "starter" | "plus" | "pro"): string {
  const priceMap = {
    starter: STRIPE_PRICES.starter_monthly,
    plus: STRIPE_PRICES.plus_monthly,
    pro: STRIPE_PRICES.pro_monthly,
  };
  return priceMap[tier];
}

/**
 * Map price IDs to tier names
 */
export function getTierForPriceId(priceId: string): "starter" | "plus" | "pro" | null {
  if (priceId === STRIPE_PRICES.starter_monthly) return "starter";
  if (priceId === STRIPE_PRICES.plus_monthly) return "plus";
  if (priceId === STRIPE_PRICES.pro_monthly) return "pro";
  return null;
}
