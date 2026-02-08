"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  skill_level: "beginner" | "intermediate" | "advanced";
  onboarding_completed: boolean;
  onboarding_step: number;
  unit_preference_volume: "gallons" | "liters";
  unit_preference_temp: "fahrenheit" | "celsius";
  created_at: string;
}

interface Subscription {
  id: string;
  tier: "free" | "starter" | "plus" | "pro";
  status: "trialing" | "active" | "past_due" | "canceled" | "unpaid";
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  subscription: Subscription | null;
  isLoading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  isTrialing: boolean;
  isPro: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data as UserProfile;
  };

  const fetchSubscription = async (userId: string) => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching subscription:", error);
      return null;
    }

    return data as Subscription;
  };

  const refreshProfile = async () => {
    if (!user) return;
    const [profileData, subscriptionData] = await Promise.all([
      fetchProfile(user.id),
      fetchSubscription(user.id),
    ]);
    if (profileData) setProfile(profileData);
    if (subscriptionData) setSubscription(subscriptionData);
  };

  const isTrialing = Boolean(
    subscription?.status === "trialing" &&
    subscription?.trial_ends_at &&
    new Date(subscription.trial_ends_at) > new Date()
  );

  const isPro = subscription?.tier === "pro" || isTrialing;

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSubscription(null);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          setUser(session.user);
          const [profileData, subscriptionData] = await Promise.all([
            fetchProfile(session.user.id),
            fetchSubscription(session.user.id),
          ]);
          setProfile(profileData);
          setSubscription(subscriptionData);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          setUser(session.user);
          const [profileData, subscriptionData] = await Promise.all([
            fetchProfile(session.user.id),
            fetchSubscription(session.user.id),
          ]);
          setProfile(profileData);
          setSubscription(subscriptionData);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
          setSubscription(null);
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          setUser(session.user);
        }
      }
    );

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        subscription,
        isLoading,
        error,
        refreshProfile,
        signOut,
        isTrialing,
        isPro,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
