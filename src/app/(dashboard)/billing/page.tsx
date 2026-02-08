import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionCard } from "@/components/billing/subscription-card";
import { TrialBanner } from "@/components/billing/trial-banner";
import { CheckCircle, XCircle } from "lucide-react";

export const metadata = {
  title: "Billing - AquaBotAI",
  description: "Manage your AquaBotAI subscription",
};

interface Props {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}

export default async function BillingPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Determine trial status
  const now = new Date();
  const isTrial =
    subscription?.status === "trialing" &&
    subscription?.trial_ends_at &&
    new Date(subscription.trial_ends_at) > now;

  const effectiveTier = isTrial ? "pro" : subscription?.tier || "free";

  let trialDaysRemaining = null;
  if (isTrial && subscription?.trial_ends_at) {
    const trialEnd = new Date(subscription.trial_ends_at);
    trialDaysRemaining = Math.ceil(
      (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  const showSuccess = params.success === "true";
  const showCanceled = params.canceled === "true";

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Success/Canceled banners */}
      {showSuccess && (
        <div className="bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 px-4 py-3 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5" />
          <div>
            <p className="font-medium">Subscription activated!</p>
            <p className="text-sm opacity-80">
              Thank you for subscribing. Enjoy your new features!
            </p>
          </div>
        </div>
      )}

      {showCanceled && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100 px-4 py-3 rounded-lg flex items-center gap-3">
          <XCircle className="w-5 h-5" />
          <div>
            <p className="font-medium">Checkout canceled</p>
            <p className="text-sm opacity-80">
              No worries! You can subscribe anytime when you&apos;re ready.
            </p>
          </div>
        </div>
      )}

      {/* Trial banner (only show if on trial and not just completed checkout) */}
      {isTrial && !showSuccess && <TrialBanner />}

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and billing settings
        </p>
      </div>

      {/* Subscription management */}
      <SubscriptionCard
        currentTier={effectiveTier}
        status={subscription?.status || "active"}
        isTrial={!!isTrial}
        trialDaysRemaining={trialDaysRemaining}
        cancelAtPeriodEnd={subscription?.cancel_at_period_end}
        currentPeriodEnd={subscription?.current_period_end}
      />

      {/* FAQ section */}
      <div className="space-y-4 pt-8">
        <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-medium">Can I cancel anytime?</h3>
            <p className="text-sm text-muted-foreground">
              Yes! You can cancel your subscription at any time. You&apos;ll continue
              to have access until the end of your billing period.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">What happens to my data if I downgrade?</h3>
            <p className="text-sm text-muted-foreground">
              Your data is always safe. If you exceed the tank limit of your new
              plan, you won&apos;t be able to add new tanks until you upgrade or delete
              existing ones.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Do you offer refunds?</h3>
            <p className="text-sm text-muted-foreground">
              We don&apos;t offer refunds, but you can cancel anytime and your
              subscription will remain active until the end of your billing period.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Is my payment information secure?</h3>
            <p className="text-sm text-muted-foreground">
              Absolutely. We use Stripe for payment processing, which is PCI-DSS
              Level 1 certified. We never store your credit card details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
