"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { useUser } from "@/lib/hooks/use-user";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, isLoading, refreshProfile } = useUser();
  const [showWizard, setShowWizard] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;

  // Retry fetching profile if user exists but profile doesn't (trigger race condition)
  const retryFetchProfile = useCallback(async () => {
    if (retryCount < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 500 * (retryCount + 1)));
      await refreshProfile();
      setRetryCount((prev) => prev + 1);
    }
  }, [retryCount, refreshProfile]);

  useEffect(() => {
    if (!isLoading) {
      // User is authenticated but profile doesn't exist yet - wait for trigger
      if (user && !profile && retryCount < maxRetries) {
        retryFetchProfile();
        return;
      }

      // No user session - redirect to login
      if (!user) {
        router.push("/login");
        return;
      }

      // User exists but profile still not found after retries - redirect to login
      // (This shouldn't happen normally, but is a safety fallback)
      if (!profile && retryCount >= maxRetries) {
        router.push("/login?error=profile_creation_failed");
        return;
      }

      // Profile exists and onboarding already complete - go to dashboard
      if (profile?.onboarding_completed) {
        router.push("/dashboard");
        return;
      }

      // Profile exists and onboarding not complete - show wizard
      if (profile && !profile.onboarding_completed) {
        setShowWizard(true);
      }
    }
  }, [isLoading, user, profile, router, retryCount, retryFetchProfile]);

  if (isLoading || !showWizard) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    );
  }

  return (
    <OnboardingWizard
      onComplete={() => {
        router.push("/dashboard");
      }}
    />
  );
}
