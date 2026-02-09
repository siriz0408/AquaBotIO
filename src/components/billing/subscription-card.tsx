"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SubscriptionCardProps {
  currentTier: string;
  status: string;
  isTrial: boolean;
  trialDaysRemaining?: number | null;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string | null;
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Basic tools for getting started",
    features: ["1 tank", "Parameter logging", "Species database", "3 maintenance tasks"],
  },
  {
    id: "starter",
    name: "Starter",
    price: "$4.99",
    description: "Get a taste of AI assistance",
    features: ["2 tanks", "10 AI messages/day", "Full parameter tracking", "10 tasks per tank"],
    popular: false,
  },
  {
    id: "plus",
    name: "Plus",
    price: "$9.99",
    description: "Full AI-powered tank management",
    features: [
      "Up to 5 tanks",
      "100 AI messages/day",
      "Photo diagnosis (10/day)",
      "AI proactive alerts",
      "AI-enhanced calculators",
    ],
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19.99",
    description: "Everything for serious aquarists",
    features: [
      "Unlimited tanks",
      "500 AI messages/day",
      "Photo diagnosis (30/day)",
      "Equipment recommendations",
      "Weekly email reports",
      "Multi-tank comparison",
    ],
    popular: false,
  },
];

export function SubscriptionCard({
  currentTier,
  status,
  isTrial,
  trialDaysRemaining,
  cancelAtPeriodEnd,
  currentPeriodEnd,
}: SubscriptionCardProps) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const handleSubscribe = async (tier: string) => {
    if (tier === "free" || tier === currentTier) return;

    setLoadingTier(tier);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();

      if (data.success && data.data.checkout_url) {
        window.location.href = data.data.checkout_url;
      } else {
        toast.error("Failed to start checkout", {
          description: data.error?.message || "Please try again",
        });
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Something went wrong", {
        description: "Please try again later",
      });
    } finally {
      setLoadingTier(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPortal(true);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success && data.data.portal_url) {
        window.location.href = data.data.portal_url;
      } else {
        toast.error("Failed to open billing portal", {
          description: data.error?.message || "Please try again",
        });
      }
    } catch (err) {
      console.error("Portal error:", err);
      toast.error("Something went wrong", {
        description: "Please try again later",
      });
    } finally {
      setLoadingPortal(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Current plan status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            {isTrial ? (
              <>
                You&apos;re on a <strong>Pro trial</strong> with{" "}
                {trialDaysRemaining} days remaining
              </>
            ) : (
              <>
                You&apos;re on the <strong className="capitalize">{currentTier}</strong> plan
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cancelAtPeriodEnd && currentPeriodEnd && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4">
              Your subscription will end on {formatDate(currentPeriodEnd)}
            </p>
          )}
          {status === "past_due" && (
            <p className="text-sm text-destructive mb-4">
              Your payment is past due. Please update your payment method to avoid service interruption.
            </p>
          )}
        </CardContent>
        {currentTier !== "free" && !isTrial && (
          <CardFooter>
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={loadingPortal}
            >
              {loadingPortal ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Manage Subscription
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isCurrentPlan = plan.id === currentTier && !isTrial;
          const isDowngrade =
            !isTrial &&
            PLANS.findIndex((p) => p.id === plan.id) <
              PLANS.findIndex((p) => p.id === currentTier);

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col",
                plan.popular && "border-primary shadow-md",
                isCurrentPlan && "ring-2 ring-primary"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {isCurrentPlan && (
                    <span className="text-xs font-normal text-muted-foreground">
                      Current
                    </span>
                  )}
                </CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.id !== "free" && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={
                    isCurrentPlan
                      ? "outline"
                      : plan.popular
                        ? "default"
                        : "secondary"
                  }
                  disabled={
                    plan.id === "free" ||
                    isCurrentPlan ||
                    isDowngrade ||
                    !!loadingTier
                  }
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {loadingTier === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : isDowngrade ? (
                    "Contact Support"
                  ) : plan.id === "free" ? (
                    "Free Forever"
                  ) : (
                    "Upgrade"
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
