"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { TIER_PRICING } from "@/lib/validation/billing";
import type {
  AdminRole,
  AdminDashboardStats,
  AdminUserView,
  AdminUserDetail,
  FeatureFlag,
  FeatureFlagInput,
  AuditLogEntry,
  AuditLogFilters,
  UserSearchParams,
  PaginatedResponse,
} from "@/lib/types/admin";

/**
 * Hook to check if current user is an admin
 */
export function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsAdmin(false);
          setAdminRole(null);
          setIsLoading(false);
          return;
        }

        // Check admin_users table
        const { data: adminProfile, error: profileError } = await supabase
          .from("admin_users")
          .select("role, is_active")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single();

        if (profileError || !adminProfile) {
          setIsAdmin(false);
          setAdminRole(null);
        } else {
          setIsAdmin(true);
          setAdminRole(adminProfile.role as AdminRole);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to check admin status");
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdmin();
  }, []);

  return { isAdmin, adminRole, isLoading, error };
}

/**
 * Hook to fetch admin dashboard stats
 */
export function useAdminStats() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get current date boundaries
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch multiple stats in parallel
      const [
        totalUsersResult,
        activeTodayResult,
        newSignupsTodayResult,
        newSignupsWeekResult,
        newSignupsMonthResult,
        subscriptionResult,
        aiUsageResult,
      ] = await Promise.all([
        // Total users
        supabase.from("users").select("id", { count: "exact", head: true }),
        // Active today (users who logged in today)
        supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .gte("last_login", todayStart),
        // New signups today
        supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .gte("created_at", todayStart),
        // New signups this week
        supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .gte("created_at", weekStart),
        // New signups this month
        supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .gte("created_at", monthStart),
        // Subscription tiers
        supabase.from("subscriptions").select("tier, status"),
        // AI usage today
        supabase
          .from("ai_usage")
          .select("message_count, tokens_used")
          .gte("date", todayStart.split("T")[0]),
      ]);

      // Calculate subscription stats
      const subscriptions = subscriptionResult.data || [];
      const proSubscribers = subscriptions.filter(
        (s) => s.tier === "pro" && s.status === "active"
      ).length;
      const plusSubscribers = subscriptions.filter(
        (s) => s.tier === "plus" && s.status === "active"
      ).length;
      const starterSubscribers = subscriptions.filter(
        (s) => s.tier === "starter" && s.status === "active"
      ).length;
      const trialUsers = subscriptions.filter(
        (s) => s.status === "trialing"
      ).length;

      // Calculate AI usage stats
      const aiUsage = aiUsageResult.data || [];
      const aiMessagesToday = aiUsage.reduce((sum, u) => sum + (u.message_count || 0), 0);
      const aiTokensToday = aiUsage.reduce((sum, u) => sum + (u.tokens_used || 0), 0);
      // Approximate cost: $0.003 per 1K input tokens, $0.015 per 1K output tokens (using average)
      const aiCostToday = (aiTokensToday / 1000) * 0.009;

      // Calculate MRR (Monthly Recurring Revenue) using centralized pricing
      const mrr =
        starterSubscribers * TIER_PRICING.starter.price +
        plusSubscribers * TIER_PRICING.plus.price +
        proSubscribers * TIER_PRICING.pro.price;

      // Calculate ARPU
      const totalPaying = proSubscribers + plusSubscribers + starterSubscribers;
      const arpu = totalPaying > 0 ? mrr / totalPaying : 0;

      // Free users (total - all paid - trial)
      const totalUsers = totalUsersResult.count || 0;
      const freeUsers = totalUsers - totalPaying - trialUsers;

      setStats({
        total_users: totalUsers,
        active_today: activeTodayResult.count || 0,
        new_signups_today: newSignupsTodayResult.count || 0,
        new_signups_week: newSignupsWeekResult.count || 0,
        new_signups_month: newSignupsMonthResult.count || 0,
        pro_subscribers: proSubscribers,
        plus_subscribers: plusSubscribers,
        starter_subscribers: starterSubscribers,
        free_users: freeUsers,
        trial_users: trialUsers,
        trial_conversion_rate: 0, // Would need historical data
        churn_rate: 0, // Would need historical data
        mrr,
        arpu,
        ai_messages_today: aiMessagesToday,
        ai_tokens_today: aiTokensToday,
        ai_cost_today: Math.round(aiCostToday * 100) / 100,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refresh: fetchStats };
}

/**
 * Hook to fetch paginated user list
 */
export function useAdminUsers(params: UserSearchParams = {}) {
  const [users, setUsers] = useState<PaginatedResponse<AdminUserView> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const page = params.page || 1;
      const limit = params.limit || 25;
      const offset = (page - 1) * limit;

      // Build query
      let query = supabase
        .from("users")
        .select(
          `
          id,
          email,
          display_name,
          created_at,
          last_login,
          auth_method,
          status,
          subscriptions (
            tier,
            status,
            trial_end_date,
            current_period_end,
            stripe_customer_id
          )
        `,
          { count: "exact" }
        );

      // Apply filters
      if (params.query) {
        query = query.or(`email.ilike.%${params.query}%,display_name.ilike.%${params.query}%`);
      }

      if (params.status) {
        query = query.eq("status", params.status);
      }

      if (params.start_date) {
        query = query.gte("created_at", params.start_date);
      }

      if (params.end_date) {
        query = query.lte("created_at", params.end_date);
      }

      // Apply sorting
      const sortBy = params.sort_by || "created_at";
      const sortOrder = params.sort_order === "asc" ? true : false;
      query = query.order(sortBy, { ascending: sortOrder });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      // Transform data
      const transformedUsers: AdminUserView[] = (data || []).map((user) => {
        const subscription = Array.isArray(user.subscriptions)
          ? user.subscriptions[0]
          : user.subscriptions;

        return {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          created_at: user.created_at,
          last_login: user.last_login,
          auth_method: user.auth_method || "email",
          subscription: subscription
            ? {
                tier: subscription.tier,
                status: subscription.status,
                trial_end_date: subscription.trial_end_date,
                current_period_end: subscription.current_period_end,
                stripe_customer_id: subscription.stripe_customer_id,
                auto_renew: true, // Default
              }
            : null,
          usage: {
            total_tanks: 0, // Would need to join tanks table
            total_ai_messages: 0,
            ai_messages_last_30_days: 0,
            total_tokens_consumed: 0,
            estimated_cost: 0,
            last_activity_date: user.last_login,
          },
          status: user.status || "active",
        };
      });

      // Filter by tier if specified (post-query since it's in joined table)
      let filteredUsers = transformedUsers;
      if (params.tier) {
        filteredUsers = transformedUsers.filter(
          (u) => u.subscription?.tier === params.tier
        );
      }

      setUsers({
        data: filteredUsers,
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, isLoading, error, refresh: fetchUsers };
}

/**
 * Hook to fetch a single user's detail
 */
export function useAdminUserDetail(userId: string) {
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Fetch user with related data
      const [userResult, tanksResult, conversationsResult] = await Promise.all([
        supabase
          .from("users")
          .select(
            `
            id,
            email,
            display_name,
            created_at,
            last_login,
            auth_method,
            status,
            subscriptions (
              tier,
              status,
              trial_end_date,
              current_period_end,
              stripe_customer_id
            )
          `
          )
          .eq("id", userId)
          .single(),
        supabase
          .from("tanks")
          .select("id, name, type, volume, volume_unit, created_at")
          .eq("user_id", userId)
          .is("deleted_at", null),
        supabase
          .from("ai_conversations")
          .select("id, topic, model_used, created_at, updated_at, messages")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(5),
      ]);

      if (userResult.error) throw userResult.error;
      if (!userResult.data) throw new Error("User not found");

      const userData = userResult.data;
      const subscription = Array.isArray(userData.subscriptions)
        ? userData.subscriptions[0]
        : userData.subscriptions;

      // Transform conversations to include message count
      const conversations = (conversationsResult.data || []).map((c) => ({
        id: c.id,
        topic: c.topic,
        message_count: Array.isArray(c.messages) ? c.messages.length : 0,
        model_used: c.model_used || "claude-sonnet-4-5-20250929",
        created_at: c.created_at,
        updated_at: c.updated_at,
      }));

      // Get last parameter log date for each tank
      const tanks: AdminUserDetail["tanks"] = await Promise.all(
        (tanksResult.data || []).map(async (tank) => {
          const { data: lastParam } = await supabase
            .from("water_parameters")
            .select("test_date")
            .eq("tank_id", tank.id)
            .order("test_date", { ascending: false })
            .limit(1)
            .single();

          return {
            ...tank,
            last_parameter_log_date: lastParam?.test_date || null,
          };
        })
      );

      setUser({
        id: userData.id,
        email: userData.email,
        display_name: userData.display_name,
        created_at: userData.created_at,
        last_login: userData.last_login,
        auth_method: userData.auth_method || "email",
        subscription: subscription
          ? {
              tier: subscription.tier,
              status: subscription.status,
              trial_end_date: subscription.trial_end_date,
              current_period_end: subscription.current_period_end,
              stripe_customer_id: subscription.stripe_customer_id,
              auto_renew: true,
            }
          : null,
        usage: {
          total_tanks: tanks.length,
          total_ai_messages: 0, // Would need aggregation
          ai_messages_last_30_days: 0,
          total_tokens_consumed: 0,
          estimated_cost: 0,
          last_activity_date: userData.last_login,
        },
        status: userData.status || "active",
        tanks,
        recent_conversations: conversations,
        subscription_history: [], // Would need separate table
        admin_notes: [], // Would need separate query
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, isLoading, error, refresh: fetchUser };
}

/**
 * Hook to fetch audit log with filters
 */
export function useAuditLog(filters: AuditLogFilters = {}) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLog = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      let query = supabase
        .from("admin_audit_log")
        .select(
          `
          id,
          admin_user_id,
          action,
          resource_type,
          resource_id,
          old_value,
          new_value,
          ip_address,
          user_agent,
          created_at,
          admin_profiles!inner (
            users (
              email,
              display_name
            )
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(100);

      // Apply filters
      if (filters.admin_user_id) {
        query = query.eq("admin_user_id", filters.admin_user_id);
      }

      if (filters.action) {
        query = query.eq("action", filters.action);
      }

      if (filters.resource_type) {
        query = query.eq("resource_type", filters.resource_type);
      }

      if (filters.start_date) {
        query = query.gte("created_at", filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte("created_at", filters.end_date);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      // Transform data
      const transformedEntries: AuditLogEntry[] = (data || []).map((entry) => {
        const adminProfilesArray = entry.admin_profiles as unknown as { users: { email: string; display_name: string | null } }[] | null;
        const adminProfile = adminProfilesArray?.[0] || null;
        return {
          id: entry.id,
          admin_user_id: entry.admin_user_id,
          admin_email: adminProfile?.users?.email || "Unknown",
          admin_name: adminProfile?.users?.display_name || null,
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          changes_before: entry.old_value,
          changes_after: entry.new_value,
          ip_address: entry.ip_address,
          user_agent: entry.user_agent,
          created_at: entry.created_at,
        };
      });

      setEntries(transformedEntries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch audit log");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  return { entries, isLoading, error, refresh: fetchAuditLog };
}

/**
 * Hook to fetch and manage feature flags
 */
export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error: queryError } = await supabase
        .from("feature_flags")
        .select("*")
        .order("flag_name", { ascending: true });

      if (queryError) throw queryError;

      setFlags(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch feature flags");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createFlag = useCallback(async (input: FeatureFlagInput) => {
    try {
      const supabase = createClient();

      const { data, error: insertError } = await supabase
        .from("feature_flags")
        .insert({
          flag_name: input.flag_name,
          description: input.description || null,
          enabled: input.enabled,
          scope: input.scope,
          tier: input.tier || null,
          rollout_percent: input.rollout_percent || 100,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setFlags((prev) => [...prev, data]);
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to create flag");
    }
  }, []);

  const updateFlag = useCallback(async (id: string, input: Partial<FeatureFlagInput>) => {
    try {
      const supabase = createClient();

      const { data, error: updateError } = await supabase
        .from("feature_flags")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      setFlags((prev) => prev.map((f) => (f.id === id ? data : f)));
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to update flag");
    }
  }, []);

  const toggleFlag = useCallback(async (id: string) => {
    const flag = flags.find((f) => f.id === id);
    if (!flag) return;

    return updateFlag(id, { enabled: !flag.enabled });
  }, [flags, updateFlag]);

  const deleteFlag = useCallback(async (id: string) => {
    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("feature_flags")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setFlags((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to delete flag");
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  return {
    flags,
    isLoading,
    error,
    refresh: fetchFlags,
    createFlag,
    updateFlag,
    toggleFlag,
    deleteFlag,
  };
}
