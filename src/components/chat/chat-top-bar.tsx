"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProactiveAlertBadge } from "./proactive-alert-badge";

interface ChatTopBarProps {
  tankId?: string;
  tankName?: string;
  tankType?: string;
  tankVolume?: number;
  onTankSelect?: () => void;
  className?: string;
}

interface AlertCounts {
  active_count: number;
  severity_counts: {
    info: number;
    warning: number;
    alert: number;
  };
}

export function ChatTopBar({
  tankId,
  tankName = "Select Tank",
  tankType,
  tankVolume,
  onTankSelect,
  className,
}: ChatTopBarProps) {
  const router = useRouter();
  const [alertCounts, setAlertCounts] = useState<AlertCounts | null>(null);

  // Fetch active alert count for current tank
  const fetchAlertCount = useCallback(async () => {
    if (!tankId) {
      setAlertCounts(null);
      return;
    }

    try {
      const response = await fetch(`/api/ai/alerts?tank_id=${tankId}&status=active&limit=100`);
      const data = await response.json();

      if (data.success) {
        setAlertCounts({
          active_count: data.data.active_count,
          severity_counts: data.data.severity_counts,
        });
      }
    } catch (error) {
      console.error("Error fetching alert count:", error);
    }
  }, [tankId]);

  // Fetch alerts on mount and when tankId changes
  useEffect(() => {
    fetchAlertCount();
  }, [fetchAlertCount]);

  // Refresh alerts when a parameter is logged (custom event)
  useEffect(() => {
    const handleRefresh = () => fetchAlertCount();
    window.addEventListener("alerts-updated", handleRefresh);
    window.addEventListener("parameter-logged", handleRefresh);
    return () => {
      window.removeEventListener("alerts-updated", handleRefresh);
      window.removeEventListener("parameter-logged", handleRefresh);
    };
  }, [fetchAlertCount]);

  const handleAlertClick = () => {
    if (tankId) {
      router.push(`/tanks/${tankId}/alerts`);
    }
  };

  const subtitle = tankType && tankVolume
    ? `${tankType.charAt(0).toUpperCase() + tankType.slice(1).replace(/_/g, " ")} • ${tankVolume} gal`
    : undefined;

  const activeAlertCount = alertCounts?.active_count || 0;

  return (
    <div className={cn("bg-white shadow-sm border-b border-gray-200", className)}>
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>

          <div>
            <h1 className="font-semibold text-brand-navy">{tankName}</h1>
            {subtitle && (
              <span className="text-xs text-gray-500">{subtitle}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Alert Badge */}
          <ProactiveAlertBadge
            count={activeAlertCount}
            onClick={handleAlertClick}
          />

          {onTankSelect && (
            <button
              onClick={onTankSelect}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ChevronDown className="w-5 h-5 text-gray-700" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
