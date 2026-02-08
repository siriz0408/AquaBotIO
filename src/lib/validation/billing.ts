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

// Tier pricing info
export const TIER_PRICING = {
  starter: {
    name: "Starter",
    price: 399, // in cents
    priceDisplay: "$3.99",
    description: "For casual hobbyists with one tank",
    features: [
      "1 tank",
      "100 AI messages/day",
      "Water parameter tracking",
      "Maintenance scheduling",
    ],
  },
  plus: {
    name: "Plus",
    price: 799,
    priceDisplay: "$7.99",
    description: "For dedicated hobbyists with multiple tanks",
    features: [
      "Up to 5 tanks",
      "200 AI messages/day",
      "Photo diagnosis (10/day)",
      "Priority support",
    ],
  },
  pro: {
    name: "Pro",
    price: 1499,
    priceDisplay: "$14.99",
    description: "For serious aquarists",
    features: [
      "Unlimited tanks",
      "Unlimited AI messages",
      "Photo diagnosis (30/day)",
      "Equipment recommendations",
      "Email reports",
    ],
  },
} as const;
