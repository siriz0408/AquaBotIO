"use client";

import { useEffect } from "react";

/**
 * Stores the current push subscription state for components to check.
 * This is set after SW registration and push subscription check.
 */
let pushSubscriptionState: {
  hasSubscription: boolean;
  endpoint: string | null;
} = {
  hasSubscription: false,
  endpoint: null,
};

/**
 * Get the current push subscription state.
 * Note: This only reflects the browser's PushManager state, not our database.
 * The usePushNotifications hook validates against the database.
 */
export function getPushSubscriptionState() {
  return pushSubscriptionState;
}

/**
 * Registers the service worker and checks push notification state.
 * - Registers SW in production only
 * - Checks for updates every 60 minutes
 * - Checks for existing push subscriptions (for hooks to use)
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(async (registration) => {
          console.log("SW registered:", registration.scope);

          // Check for updates every 60 minutes
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

          // Check if push notifications are supported
          if ("PushManager" in window) {
            try {
              // Get existing push subscription (if any)
              const subscription = await registration.pushManager.getSubscription();
              if (subscription) {
                pushSubscriptionState = {
                  hasSubscription: true,
                  endpoint: subscription.endpoint,
                };
                console.log("Push subscription found:", subscription.endpoint.slice(0, 50) + "...");
              } else {
                pushSubscriptionState = {
                  hasSubscription: false,
                  endpoint: null,
                };
                console.log("No push subscription found");
              }
            } catch (err) {
              console.warn("Error checking push subscription:", err);
            }
          }
        })
        .catch((error) => {
          console.error("SW registration failed:", error);
        });
    }
  }, []);

  return null;
}
