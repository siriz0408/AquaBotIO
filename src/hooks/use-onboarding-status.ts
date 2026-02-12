"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface UserPreferences {
  id: string;
  user_id: string;
  experience_level?: string;
  current_situation?: string;
  primary_goal?: string;
  current_challenges?: string[];
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UseOnboardingStatusReturn {
  hasCompletedAIOnboarding: boolean;
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to check if user has completed AI onboarding (personalization questionnaire).
 *
 * This is separate from the regular onboarding flow (tank setup).
 * The AI onboarding collects preferences for personalizing AI responses.
 */
export function useOnboardingStatus(): UseOnboardingStatusReturn {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createClient();

  const fetchPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setPreferences(null);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 = no rows found, which is expected for new users
        throw new Error(fetchError.message);
      }

      setPreferences(data as UserPreferences | null);
    } catch (err) {
      setError(err as Error);
      setPreferences(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const hasCompletedAIOnboarding = Boolean(preferences?.onboarding_completed_at);

  return {
    hasCompletedAIOnboarding,
    preferences,
    isLoading,
    error,
    refresh: fetchPreferences,
  };
}
