"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { useUser } from "@/lib/hooks/use-user";

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, isLoading } = useUser();
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!profile) {
        router.push("/login");
      } else if (profile.onboarding_completed) {
        router.push("/dashboard");
      } else {
        setShowWizard(true);
      }
    }
  }, [isLoading, profile, router]);

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
