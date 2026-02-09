import { z } from "zod";

/**
 * Billing validation schemas
 */

// Valid subscription tiers for checkout
export const subscriptionTierSchema = z.enum(["starter", "plus", "pro"]);

export type SubscriptionTier = z.infer<typeof subscriptionTierSchema>;

// Checkout request schema
export const checkoutRequestSchema = z.object({
  tier: subscriptionTierSchema,
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

// Portal request schema
export const portalRequestSchema = z.object({
  return_url: z.string().url().optional(),
});

export type PortalRequest = z.infer<typeof portalRequestSchema>;

// Subscription status
export const subscriptionStatusSchema = z.enum([
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "paused",
  "unpaid",
]);

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

// Validate checkout request
export function validateCheckoutRequest(data: unknown): {
  success: boolean;
  data?: CheckoutRequest;
  errors?: Record<string, string[]>;
} {
  const result = checkoutRequestSchema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "general";
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

// Validate portal request
export function validatePortalRequest(data: unknown): {
  success: boolean;
  data?: PortalRequest;
  errors?: Record<string, string[]>;
} {
  const result = portalRequestSchema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "general";
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

// Tier pricing info - Updated per Spec 18
export const TIER_PRICING = {
  starter: {
    name: "Starter",
    price: 499, // in cents - changed from 399 per Spec 18
    priceDisplay: "$4.99",
    description: "Get a taste of AI assistance",
    features: [
      "2 tanks",
      "10 AI messages/day",
      "Full parameter tracking",
      "10 tasks per tank",
    ],
  },
  plus: {
    name: "Plus",
    price: 999, // changed from 799 per Spec 18
    priceDisplay: "$9.99",
    description: "Full AI-powered tank management",
    features: [
      "Up to 5 tanks",
      "100 AI messages/day",
      "Photo diagnosis (10/day)",
      "AI proactive alerts",
    ],
  },
  pro: {
    name: "Pro",
    price: 1999, // changed from 1499 per Spec 18
    priceDisplay: "$19.99",
    description: "Everything for serious aquarists",
    features: [
      "Unlimited tanks",
      "500 AI messages/day",
      "Photo diagnosis (30/day)",
      "Equipment recommendations",
      "Weekly email reports",
    ],
  },
} as const;
