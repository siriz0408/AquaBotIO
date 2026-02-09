"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Converts a base64 URL-safe string to a Uint8Array.
 * Required for Web Push API's applicationServerKey.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface UsePushNotificationsReturn {
  /** Whether the browser supports push notifications */
  isSupported: boolean;
  /** Current notification permission state */
  permission: NotificationPermission;
  /** Whether user has an active push subscription in our database */
  isSubscribed: boolean;
  /** Request permission and register push subscription */
  subscribe: () => Promise<void>;
  /** Unregister push subscription */
  unsubscribe: () => Promise<void>;
  /** Loading state for async operations */
  isLoading: boolean;
  /** Error message if any operation failed */
  error: string | null;
  /** Whether VAPID key is configured */
  isConfigured: boolean;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Check if push is supported and configured
  useEffect(() => {
    const checkSupport = async () => {
      // Check browser support
      const supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      setIsSupported(supported);

      // Check VAPID key configuration
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.warn("VAPID public key not configured - push notifications disabled");
        setIsConfigured(false);
        setIsLoading(false);
        return;
      }
      setIsConfigured(true);

      if (!supported) {
        setIsLoading(false);
        return;
      }

      // Get current permission state
      setPermission(Notification.permission);
    };

    checkSupport();
  }, []);

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSupported || !isConfigured) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          // Verify subscription exists in database
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data } = await supabase
              .from("push_subscriptions")
              .select("id")
              .eq("user_id", user.id)
              .eq("endpoint", subscription.endpoint)
              .single();

            setIsSubscribed(!!data);
          }
        } else {
          setIsSubscribed(false);
        }
      } catch (err) {
        console.error("Error checking push subscription:", err);
        setIsSubscribed(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (isSupported && isConfigured) {
      checkSubscription();
    }
  }, [isSupported, isConfigured, supabase]);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError("Push notifications are not supported in this browser");
      return;
    }

    if (!isConfigured) {
      setError("Push notifications are not configured");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        setError("Notification permission was denied");
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID key
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setError("VAPID public key not configured");
        return;
      }

      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Get subscription keys
      const subscriptionJson = subscription.toJSON();

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to enable notifications");
        return;
      }

      // Save subscription to database
      const { error: dbError } = await supabase
        .from("push_subscriptions")
        .upsert(
          {
            user_id: user.id,
            endpoint: subscriptionJson.endpoint,
            auth_key: subscriptionJson.keys?.auth || "",
            p256dh_key: subscriptionJson.keys?.p256dh || "",
            user_agent: navigator.userAgent,
          },
          {
            onConflict: "endpoint",
          }
        );

      if (dbError) {
        console.error("Error saving push subscription:", dbError);
        setError("Failed to save notification preferences");
        return;
      }

      // Update notification preferences to enable push
      await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: user.id,
            push_enabled: true,
          },
          {
            onConflict: "user_id",
          }
        );

      setIsSubscribed(true);
    } catch (err) {
      console.error("Error subscribing to push:", err);
      setError("Failed to enable notifications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, isConfigured, supabase]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Get user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Remove subscription from database
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", user.id)
            .eq("endpoint", subscription.endpoint);

          // Update notification preferences
          await supabase
            .from("notification_preferences")
            .update({ push_enabled: false })
            .eq("user_id", user.id);
        }
      }

      setIsSubscribed(false);
    } catch (err) {
      console.error("Error unsubscribing from push:", err);
      setError("Failed to disable notifications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, supabase]);

  return {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
    isLoading,
    error,
    isConfigured,
  };
}
