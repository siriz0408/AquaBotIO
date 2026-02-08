"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SubscriptionTier,
  getUpgradeTier,
  getTierDisplayName,
  getTierPrice,
  TIER_LIMITS,
} from "@/lib/hooks/use-tier-limits";

interface UpgradePromptProps {
  currentTier: SubscriptionTier;
  feature: "tanks" | "ai_messages" | "photo_diagnosis" | "equipment_recs";
  currentCount?: number;
  className?: string;
}

const FEATURE_LABELS: Record<UpgradePromptProps["feature"], string> = {
  tanks: "tanks",
  ai_messages: "AI messages per day",
  photo_diagnosis: "photo diagnoses per day",
  equipment_recs: "equipment recommendations per day",
};

const FEATURE_LIMIT_KEYS: Record<
  UpgradePromptProps["feature"],
  keyof (typeof TIER_LIMITS)["free"]
> = {
  tanks: "tanks",
  ai_messages: "ai_messages_daily",
  photo_diagnosis: "photo_diagnosis_daily",
  equipment_recs: "equipment_recs_daily",
};

export function UpgradePrompt({
  currentTier,
  feature,
  currentCount,
  className,
}: UpgradePromptProps) {
  const upgradeTier = getUpgradeTier(currentTier);

  if (!upgradeTier) {
    // User is on Pro, no upgrade available
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Limit Reached
          </CardTitle>
          <CardDescription>
            You&apos;ve reached your plan limit. Contact support if you need
            additional capacity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/settings">Contact Support</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentLimit = TIER_LIMITS[currentTier][FEATURE_LIMIT_KEYS[feature]];
  const upgradeLimit = TIER_LIMITS[upgradeTier][FEATURE_LIMIT_KEYS[feature]];
  const featureLabel = FEATURE_LABELS[feature];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          Upgrade to {getTierDisplayName(upgradeTier)}
        </CardTitle>
        <CardDescription>
          {currentCount !== undefined ? (
            <>
              You&apos;ve used {currentCount} of {currentLimit} {featureLabel}.
            </>
          ) : (
            <>
              You&apos;ve reached the {getTierDisplayName(currentTier)} limit of{" "}
              {currentLimit} {featureLabel}.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4">
          <div className="mb-2 text-sm font-medium">
            {getTierDisplayName(upgradeTier)} Plan Benefits:
          </div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {feature === "tanks" && (
              <li>
                • Up to{" "}
                {upgradeLimit >= 999999 ? "unlimited" : upgradeLimit} tanks
              </li>
            )}
            {feature === "ai_messages" && (
              <li>
                •{" "}
                {upgradeLimit >= 999999
                  ? "Unlimited"
                  : `Up to ${upgradeLimit}`}{" "}
                AI messages per day
              </li>
            )}
            {TIER_LIMITS[upgradeTier].photo_diagnosis_daily > 0 && (
              <li>
                • {TIER_LIMITS[upgradeTier].photo_diagnosis_daily} photo
                diagnoses per day
              </li>
            )}
            {TIER_LIMITS[upgradeTier].equipment_recs_daily > 0 && (
              <li>
                • {TIER_LIMITS[upgradeTier].equipment_recs_daily} equipment
                recommendations per day
              </li>
            )}
          </ul>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold">
              {getTierPrice(upgradeTier)}
            </span>
          </div>
          <Button asChild>
            <Link href="/settings/billing">
              Upgrade Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
