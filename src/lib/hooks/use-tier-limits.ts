"use client";

import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

// Tier limits per Spec 18 - Pricing Strategy
// Note: All tiers share the same keys for type safety
export const TIER_LIMITS = {
  free: {
    tanks: 1,
    ai_messages_daily: 0, // Changed from 10 per Spec 18
    maintenance_tasks: 3, // Total across all tanks for free tier
    photo_diagnosis_daily: 0,
    equipment_recs_daily: 0,
  },
  starter: {
    tanks: 2, // Changed from 1 per Spec 18
    ai_messages_daily: 10, // Changed from 100 per Spec 18
    maintenance_tasks: 10, // Per tank for paid tiers
    photo_diagnosis_daily: 0,
    equipment_recs_daily: 0,
  },
  plus: {
    tanks: 5,
    ai_messages_daily: 100, // Changed from 200 per Spec 18
    maintenance_tasks: 10, // Per tank
    photo_diagnosis_daily: 10,
    equipment_recs_daily: 0,
  },
  pro: {
    tanks: 999999, // Effectively unlimited
    ai_messages_daily: 500, // Changed from 999999 per Spec 18
    maintenance_tasks: 999999, // Effectively unlimited per tank
    photo_diagnosis_daily: 30,
    equipment_recs_daily: 10,
  },
} as const;

export type SubscriptionTier = keyof typeof TIER_LIMITS;

export interface TierCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  tier: SubscriptionTier;
  message?: string;
}

/**
 * Resolve user's effective tier with admin/override/trial priority
 *
 * Priority chain (per Spec 18 R-018.4):
 * 1. Admin profile (admin_profiles.is_active = true) -> always 'pro'
 * 2. Tier override (subscriptions.tier_override, not expired) -> override tier
 * 3. Active trial (subscriptions.status = 'trialing', trial_ends_at > now) -> 'pro'
 * 4. Active subscription (subscriptions.status = 'active') -> subscriptions.tier
 * 5. Default -> 'free'
 */
export async function resolveUserTier(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionTier> {
  // 1. Check admin profile
  const { data: adminProfile } = await supabase
    .from("admin_profiles")
    .select("role, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (adminProfile) return "pro";

  // 2. Check subscription + override
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier, status, trial_ends_at, tier_override, override_expires_at")
    .eq("user_id", userId)
    .single();

  if (!subscription) return "free";

  // Check tier override first
  if (subscription.tier_override) {
    const notExpired =
      !subscription.override_expires_at ||
      new Date(subscription.override_expires_at) > new Date();
    if (notExpired) return subscription.tier_override as SubscriptionTier;
  }

  // 3. Active trial -> pro
  const isTrialing =
    subscription.status === "trialing" &&
    subscription.trial_ends_at &&
    new Date(subscription.trial_ends_at) > new Date();
  if (isTrialing) return "pro";

  // 4. Active subscription -> tier
  if (subscription.status === "active") {
    return (subscription.tier as SubscriptionTier) || "free";
  }

  // 5. Default
  return "free";
}

/**
 * Hook to check tier-based limits
 */
export function useTierLimits() {
  const supabase = createClient();

  /**
   * Check if user can create more tanks
   */
  const canCreateTank = useCallback(
    async (userId: string): Promise<TierCheckResult> => {
      // Use centralized tier resolution
      const tier = await resolveUserTier(supabase, userId);

      // Get current tank count
      const { count } = await supabase
        .from("tanks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("deleted_at", null);

      const currentCount = count || 0;
      const limit = TIER_LIMITS[tier].tanks;
      const allowed = currentCount < limit;

      return {
        allowed,
        currentCount,
        limit,
        tier,
        message: allowed
          ? undefined
          : tier === "pro"
            ? "Tank limit reached. Contact support for assistance."
            : `You've reached the ${tier === "free" ? "free tier" : tier} limit of ${limit} tank${limit !== 1 ? "s" : ""}. Upgrade to add more tanks.`,
      };
    },
    [supabase]
  );

  /**
   * Check if user can send more AI messages today
   */
  const canSendAIMessage = useCallback(
    async (userId: string): Promise<TierCheckResult> => {
      // Use centralized tier resolution
      const tier = await resolveUserTier(supabase, userId);

      // Get today's message count
      const today = new Date().toISOString().split("T")[0];
      const { data: usage } = await supabase
        .from("ai_usage")
        .select("message_count")
        .eq("user_id", userId)
        .eq("date", today)
        .eq("feature", "chat")
        .single();

      const currentCount = usage?.message_count || 0;
      const limit = TIER_LIMITS[tier].ai_messages_daily;
      const allowed = currentCount < limit;

      // Special message for free tier (0 AI messages)
      let message: string | undefined;
      if (!allowed) {
        if (tier === "free") {
          message =
            "AI chat is not available on the free plan. Upgrade to Starter or higher to unlock AI assistance.";
        } else if (tier === "pro") {
          message = `You've reached your daily limit of ${limit} AI messages. Your limit resets at midnight UTC.`;
        } else {
          message = `You've used all ${limit} AI messages for today. Upgrade for more messages!`;
        }
      }

      return {
        allowed,
        currentCount,
        limit,
        tier,
        message,
      };
    },
    [supabase]
  );

  /**
   * Check if user can use photo diagnosis today
   * Per Spec 09 R-101.7: Free/Starter: 0, Plus: 10/day, Pro: 30/day
   */
  const canUsePhotoDiagnosis = useCallback(
    async (userId: string): Promise<TierCheckResult> => {
      // Use centralized tier resolution
      const tier = await resolveUserTier(supabase, userId);

      // Get today's diagnosis count
      const today = new Date().toISOString().split("T")[0];
      const { data: usage } = await supabase
        .from("ai_usage")
        .select("message_count")
        .eq("user_id", userId)
        .eq("date", today)
        .eq("feature", "diagnosis")
        .single();

      const currentCount = usage?.message_count || 0;
      const limit = TIER_LIMITS[tier].photo_diagnosis_daily;
      const allowed = limit > 0 && currentCount < limit;

      // Generate appropriate message
      let message: string | undefined;
      if (!allowed) {
        if (limit === 0) {
          // Feature not available on this tier
          message =
            "Photo diagnosis requires Plus or Pro plan. Upgrade to unlock AI-powered species identification and disease diagnosis.";
        } else if (tier === "pro") {
          message = `You've reached your daily limit of ${limit} photo diagnoses. Your limit resets at midnight UTC.`;
        } else {
          message = `You've used all ${limit} photo diagnoses for today. Upgrade to Pro for 30 diagnoses per day!`;
        }
      }

      return {
        allowed,
        currentCount,
        limit,
        tier,
        message,
      };
    },
    [supabase]
  );

  return {
    canCreateTank,
    canSendAIMessage,
    canUsePhotoDiagnosis,
    resolveUserTier: (userId: string) => resolveUserTier(supabase, userId),
    TIER_LIMITS,
  };
}

/**
 * Get the upgrade tier based on current tier
 */
export function getUpgradeTier(
  currentTier: SubscriptionTier
): SubscriptionTier | null {
  const upgradeMap: Record<SubscriptionTier, SubscriptionTier | null> = {
    free: "starter",
    starter: "plus",
    plus: "pro",
    pro: null,
  };
  return upgradeMap[currentTier];
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    free: "Free",
    starter: "Starter",
    plus: "Plus",
    pro: "Pro",
  };
  return names[tier];
}

/**
 * Get tier price (per Spec 18 updated pricing)
 */
export function getTierPrice(tier: SubscriptionTier): string {
  const prices: Record<SubscriptionTier, string> = {
    free: "$0",
    starter: "$4.99/mo", // Changed from $3.99 per Spec 18
    plus: "$9.99/mo", // Changed from $7.99 per Spec 18
    pro: "$19.99/mo", // Changed from $14.99 per Spec 18
  };
  return prices[tier];
}

/**
 * Get tier features for display
 */
/**
 * Check if maintenance tasks limit is per tank or total
 * Free tier has total limit, paid tiers have per-tank limit
 */
export function isMaintenanceTaskLimitTotal(tier: SubscriptionTier): boolean {
  return tier === "free";
}

export function getTierFeatures(tier: SubscriptionTier): string[] {
  const features: Record<SubscriptionTier, string[]> = {
    free: [
      "1 tank",
      "Parameter logging",
      "Species database browsing",
      "3 maintenance tasks total",
      "Basic calculators",
    ],
    starter: [
      "2 tanks",
      "10 AI messages/day",
      "10 maintenance tasks per tank",
      "Parameter logging & trends",
      "Basic calculators",
    ],
    plus: [
      "5 tanks",
      "100 AI messages/day",
      "AI-enhanced calculators",
      "Photo diagnosis (10/day)",
      "Proactive AI alerts",
    ],
    pro: [
      "Unlimited tanks",
      "500 AI messages/day",
      "Photo diagnosis (30/day)",
      "Equipment recommendations",
      "Weekly AI digest emails",
      "Multi-tank comparison",
    ],
  };
  return features[tier];
}
