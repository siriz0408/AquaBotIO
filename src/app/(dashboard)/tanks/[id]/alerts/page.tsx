"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bell, BellOff, Loader2, Fish, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProactiveAlertCard, type ProactiveAlert } from "@/components/chat/proactive-alert-card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AlertWithTank extends ProactiveAlert {
  tank?: {
    id: string;
    name: string;
    type: string;
  };
  created_at: string;
}

interface AlertsData {
  alerts: AlertWithTank[];
  count: number;
  active_count: number;
  severity_counts: {
    info: number;
    warning: number;
    alert: number;
  };
}

export default function TankAlertsPage() {
  const params = useParams();
  const router = useRouter();
  const tankId = params.id as string;

  const [data, setData] = useState<AlertsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<"active" | "dismissed" | "all">("active");

  // Fetch alerts for the tank
  const fetchAlerts = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    }

    try {
      const statusParam = filter === "all" ? "all" : filter;
      const response = await fetch(`/api/ai/alerts?tank_id=${tankId}&status=${statusParam}&limit=100`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast.error(result.error?.message || "Failed to load alerts");
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast.error("Failed to load alerts");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [tankId, filter]);

  // Load alerts on mount and when filter changes
  useEffect(() => {
    setIsLoading(true);
    fetchAlerts();
  }, [fetchAlerts]);

  // Handle alert dismissal
  const handleDismiss = async (alertId: string) => {
    try {
      const response = await fetch("/api/ai/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "dismiss",
          alert_id: alertId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Alert dismissed");
        // Trigger global refresh
        window.dispatchEvent(new Event("alerts-updated"));
        // Refetch alerts
        fetchAlerts();
      } else {
        toast.error(result.error?.message || "Failed to dismiss alert");
      }
    } catch (error) {
      console.error("Error dismissing alert:", error);
      toast.error("Failed to dismiss alert");
    }
  };

  // Handle taking action on alert suggestion
  const handleTakeAction = (action: string) => {
    toast.info(action, {
      description: "Follow this suggestion to address the alert",
      duration: 5000,
    });
  };

  // Navigate to chat to ask about alerts
  const handleAskAI = () => {
    router.push(`/tanks/${tankId}/chat`);
  };

  const alerts = data?.alerts || [];
  const activeCount = data?.active_count || 0;
  const severityCounts = data?.severity_counts || { info: 0, warning: 0, alert: 0 };

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/tanks/${tankId}`}>
                <ArrowLeft className="h-5 w-5 text-brand-navy" />
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold text-brand-navy">Proactive Alerts</h1>
              <span className="text-xs text-gray-500">
                {activeCount > 0
                  ? `${activeCount} active alert${activeCount !== 1 ? "s" : ""}`
                  : "No active alerts"}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchAlerts(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-5 w-5 text-gray-600", isRefreshing && "animate-spin")} />
          </Button>
        </div>

        {/* Severity Summary */}
        {activeCount > 0 && (
          <div className="px-4 pb-3 flex gap-2">
            {severityCounts.alert > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#FF6B6B]/10 text-[#FF6B6B]">
                {severityCounts.alert} Critical
              </span>
            )}
            {severityCounts.warning > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F59E0B]/10 text-[#F59E0B]">
                {severityCounts.warning} Warning
              </span>
            )}
            {severityCounts.info > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#00B4D8]/10 text-[#00B4D8]">
                {severityCounts.info} Info
              </span>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="px-4 pb-2 flex gap-2">
          <Button
            variant={filter === "active" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("active")}
            className={cn(
              "rounded-full",
              filter === "active" && "bg-brand-cyan/10 text-brand-cyan"
            )}
          >
            Active
          </Button>
          <Button
            variant={filter === "dismissed" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("dismissed")}
            className={cn(
              "rounded-full",
              filter === "dismissed" && "bg-brand-cyan/10 text-brand-cyan"
            )}
          >
            Dismissed
          </Button>
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-full",
              filter === "all" && "bg-brand-cyan/10 text-brand-cyan"
            )}
          >
            All
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 space-y-4 pb-24">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-brand-teal mb-2" />
            <span className="text-gray-500 text-sm">Loading alerts...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-brand-teal/20 to-brand-navy/20 flex items-center justify-center">
              {filter === "active" ? (
                <Bell className="w-8 h-8 text-brand-teal" />
              ) : (
                <BellOff className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2 text-brand-navy">
              {filter === "active"
                ? "No Active Alerts"
                : filter === "dismissed"
                  ? "No Dismissed Alerts"
                  : "No Alerts"}
            </h3>
            <p className="text-gray-600 text-sm max-w-xs mb-6">
              {filter === "active"
                ? "Great news! Your tank is looking healthy with no concerning trends detected."
                : filter === "dismissed"
                  ? "You haven't dismissed any alerts yet."
                  : "No alerts have been generated for this tank."}
            </p>
            {filter === "active" && (
              <Button onClick={handleAskAI} className="bg-brand-teal hover:bg-brand-teal/90">
                <Fish className="w-4 h-4 mr-2" />
                Ask AquaBot About My Tank
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <ProactiveAlertCard
                key={alert.id}
                alert={alert}
                onDismiss={filter !== "dismissed" ? handleDismiss : undefined}
                onTakeAction={handleTakeAction}
              />
            ))}
          </div>
        )}
      </main>

      {/* Bottom Action Bar */}
      {!isLoading && alerts.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 safe-area-pb">
          <Button
            onClick={handleAskAI}
            className="w-full bg-gradient-to-r from-brand-cyan to-brand-navy text-white"
          >
            <Fish className="w-4 h-4 mr-2" />
            Ask AquaBot for Help
          </Button>
        </div>
      )}
    </div>
  );
}
