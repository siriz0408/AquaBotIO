"use client";

import { useState, useEffect } from "react";
import { X, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TrialBannerProps {
  className?: string;
}

export function TrialBanner({ className }: TrialBannerProps) {
  const [subscription, setSubscription] = useState<{
    is_trial: boolean;
    trial_days_remaining: number | null;
    tier: string;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/billing/subscription");
      const data = await response.json();
      if (data.success) {
        setSubscription(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
    }
  };

  // Don't show if not on trial, dismissed, or data not loaded
  if (!subscription?.is_trial || dismissed) {
    return null;
  }

  const daysRemaining = subscription.trial_days_remaining ?? 0;
  const isUrgent = daysRemaining <= 3;

  return (
    <div
      className={cn(
        "relative px-4 py-3 flex items-center justify-between gap-4",
        isUrgent
          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100"
          : "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {isUrgent ? (
          <Clock className="w-5 h-5 shrink-0" />
        ) : (
          <Sparkles className="w-5 h-5 shrink-0" />
        )}
        <div className="text-sm">
          <span className="font-medium">
            {isUrgent
              ? daysRemaining === 0
                ? "Your trial ends today!"
                : `Only ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left in your trial!`
              : `You're enjoying a free Pro trial - ${daysRemaining} days remaining`}
          </span>
          <span className="hidden sm:inline text-opacity-80 ml-1">
            {isUrgent
              ? " Subscribe now to keep all your features."
              : " Upgrade anytime to keep all features."}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          asChild
          size="sm"
          variant={isUrgent ? "default" : "secondary"}
          className="shrink-0"
        >
          <Link href="/billing">
            {isUrgent ? "Subscribe Now" : "View Plans"}
          </Link>
        </Button>
        {!isUrgent && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setDismissed(true)}
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        )}
      </div>
    </div>
  );
}
