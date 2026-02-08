"use client";

import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

// Tier limits per CLAUDE.md
export const TIER_LIMITS = {
  free: {
    tanks: 1,
    ai_messages_daily: 10,
    photo_diagnosis_daily: 0,
    equipment_recs_daily: 0,
  },
  starter: {
    tanks: 1,
    ai_messages_daily: 100,
    photo_diagnosis_daily: 0,
    equipment_recs_daily: 0,
  },
  plus: {
    tanks: 5,
    ai_messages_daily: 200,
    photo_diagnosis_daily: 10,
    equipment_recs_daily: 0,
  },
  pro: {
    tanks: 999999, // Effectively unlimited
    ai_messages_daily: 999999,
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
 * Hook to check tier-based limits
 */
export function useTierLimits() {
  const supabase = createClient();

  /**
   * Check if user can create more tanks
   */
  const canCreateTank = useCallback(
    async (userId: string): Promise<TierCheckResult> => {
      // Get user's subscription tier
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("tier, status, trial_ends_at")
        .eq("user_id", userId)
        .single();

      // Default to free tier if no subscription
      let tier: SubscriptionTier = "free";

      if (subscription) {
        // Check if in active trial
        const isTrialing =
          subscription.status === "trialing" &&
          subscription.trial_ends_at &&
          new Date(subscription.trial_ends_at) > new Date();

        // During trial, get Pro access
        if (isTrialing) {
          tier = "pro";
        } else if (subscription.status === "active") {
          tier = subscription.tier as SubscriptionTier;
        }
      }

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
      // Get user's subscription tier
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("tier, status, trial_ends_at")
        .eq("user_id", userId)
        .single();

      let tier: SubscriptionTier = "free";

      if (subscription) {
        const isTrialing =
          subscription.status === "trialing" &&
          subscription.trial_ends_at &&
          new Date(subscription.trial_ends_at) > new Date();

        if (isTrialing) {
          tier = "pro";
        } else if (subscription.status === "active") {
          tier = subscription.tier as SubscriptionTier;
        }
      }

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

      return {
        allowed,
        currentCount,
        limit,
        tier,
        message: allowed
          ? undefined
          : `You've used all ${limit} AI messages for today. ${tier !== "pro" ? "Upgrade for more messages!" : ""}`,
      };
    },
    [supabase]
  );

  return {
    canCreateTank,
    canSendAIMessage,
    TIER_LIMITS,
  };
}

/**
 * Get the upgrade tier based on current tier
 */
export function getUpgradeTier(currentTier: SubscriptionTier): SubscriptionTier | null {
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
 * Get tier price
 */
export function getTierPrice(tier: SubscriptionTier): string {
  const prices: Record<SubscriptionTier, string> = {
    free: "$0",
    starter: "$3.99/mo",
    plus: "$7.99/mo",
    pro: "$14.99/mo",
  };
  return prices[tier];
}
