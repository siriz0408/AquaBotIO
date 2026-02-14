"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Coaching message from history
 */
export interface CoachingMessage {
  id: string;
  user_id: string;
  tank_id: string | null;
  tank_name: string | null;
  message: string;
  created_at: string;
}

interface UseCoachingHistoryReturn {
  data: CoachingMessage[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch coaching history with pagination.
 *
 * Note: This hook expects the Backend to implement:
 * - GET /api/ai/coaching/history?limit=N&offset=M
 * - A `coaching_messages` table to store history
 *
 * Until Backend implements this, the hook will return empty results gracefully.
 */
export function useCoachingHistory(limit = 10): UseCoachingHistoryReturn {
  const [data, setData] = useState<CoachingMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const supabase = createClient();

  const fetchHistory = useCallback(
    async (currentOffset: number, append = false) => {
      try {
        setIsLoading(true);
        setError(null);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setData([]);
          setHasMore(false);
          return;
        }

        // Try to fetch from the API endpoint
        // If it doesn't exist yet, we'll get a 404 and handle gracefully
        const response = await fetch(
          `/api/ai/coaching/history?limit=${limit}&offset=${currentOffset}`
        );

        if (!response.ok) {
          // API not implemented yet - return empty state gracefully
          if (response.status === 404) {
            setData([]);
            setHasMore(false);
            return;
          }
          throw new Error("Failed to fetch coaching history");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || "Failed to fetch coaching history");
        }

        const messages: CoachingMessage[] = result.data || [];

        if (append) {
          setData((prev) => [...prev, ...messages]);
        } else {
          setData(messages);
        }

        // If we got fewer items than requested, no more to load
        setHasMore(messages.length === limit);
      } catch (err) {
        // Don't show error for missing endpoint - just return empty
        if (err instanceof Error && err.message.includes("404")) {
          setData([]);
          setHasMore(false);
        } else {
          setError(err as Error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, limit]
  );

  // Initial fetch
  useEffect(() => {
    fetchHistory(0);
  }, [fetchHistory]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    const newOffset = offset + limit;
    setOffset(newOffset);
    await fetchHistory(newOffset, true);
  }, [hasMore, isLoading, offset, limit, fetchHistory]);

  const refresh = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    await fetchHistory(0);
  }, [fetchHistory]);

  return {
    data,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
