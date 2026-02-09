"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useUser } from "@/lib/hooks/use-user";
import { cn } from "@/lib/utils";

interface PushPermissionPromptProps {
  className?: string;
}

/**
 * Push notification permission prompt component.
 * Shows when user hasn't granted notification permission and push is supported.
 * Only shows to logged-in users on dashboard routes.
 */
export function PushPermissionPrompt({ className }: PushPermissionPromptProps) {
  const { user, isLoading: userLoading } = useUser();
  const {
    isSupported,
    isConfigured,
    permission,
    isSubscribed,
    subscribe,
    isLoading,
  } = usePushNotifications();

  const [dismissed, setDismissed] = useState(false);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  // Check if user previously dismissed the prompt
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissedUntil = localStorage.getItem("push_prompt_dismissed_until");
      if (dismissedUntil) {
        const dismissedDate = new Date(dismissedUntil);
        if (dismissedDate > new Date()) {
          setDismissed(true);
        } else {
          localStorage.removeItem("push_prompt_dismissed_until");
        }
      }
      setHasCheckedStorage(true);
    }
  }, []);

  const handleDismiss = () => {
    // Dismiss for 7 days
    const dismissUntil = new Date();
    dismissUntil.setDate(dismissUntil.getDate() + 7);
    localStorage.setItem("push_prompt_dismissed_until", dismissUntil.toISOString());
    setDismissed(true);
  };

  const handleEnable = async () => {
    await subscribe();
    // If subscribe was successful, the prompt will hide automatically
    // because isSubscribed will become true
  };

  // Don't render while checking storage or loading user
  if (!hasCheckedStorage || userLoading) {
    return null;
  }

  // Don't show if user is not logged in
  if (!user) {
    return null;
  }

  // Don't show if push is not supported or not configured
  if (!isSupported || !isConfigured) {
    return null;
  }

  // Don't show if already subscribed
  if (isSubscribed) {
    return null;
  }

  // Don't show if permission is denied (user explicitly blocked)
  if (permission === "denied") {
    return null;
  }

  // Don't show if dismissed
  if (dismissed) {
    return null;
  }

  return (
    <Card
      className={cn(
        "border-brand-cyan/20 bg-gradient-to-r from-brand-cyan/5 to-brand-bg shadow-sm",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-cyan/10">
            <Bell className="h-5 w-5 text-brand-cyan" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-brand-navy">
              Enable Notifications
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Get reminders for water changes, maintenance tasks, and important alerts about your aquarium.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={handleEnable}
                disabled={isLoading}
                className="bg-brand-cyan hover:bg-brand-cyan/90"
              >
                {isLoading ? "Enabling..." : "Enable Notifications"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                disabled={isLoading}
              >
                Not Now
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 -mt-1 -mr-2"
            onClick={handleDismiss}
            aria-label="Dismiss notification prompt"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
