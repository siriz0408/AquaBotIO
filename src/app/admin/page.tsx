"use client";

import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Cpu,
  Flag,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCard, StatsCardSkeleton } from "@/components/admin/stats-card";
import { useAdminStats, useAuditLog } from "@/lib/hooks/use-admin";
import { AuditLogEntryRow } from "@/components/admin/audit-log-entry";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { stats, isLoading: statsLoading } = useAdminStats();
  const { entries: auditEntries, isLoading: auditLoading } = useAuditLog();

  // Format currency from cents
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Overview of platform metrics and recent activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push("/admin/feature-flags")}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Flag className="h-4 w-4 mr-2" />
            Feature Flags
          </Button>
          <Button
            onClick={() => router.push("/admin/users")}
            className="bg-brand-teal hover:bg-brand-teal/90 text-white"
          >
            <Users className="h-4 w-4 mr-2" />
            View Users
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard
              title="Total Users"
              value={stats?.total_users?.toLocaleString() || "0"}
              description={`${stats?.active_today || 0} active today`}
              icon={Users}
            />
            <StatsCard
              title="New Signups"
              value={stats?.new_signups_today?.toLocaleString() || "0"}
              description="Today"
              icon={UserPlus}
              trend={{
                value: stats?.new_signups_week || 0,
                label: "this week",
                isPositive: true,
              }}
            />
            <StatsCard
              title="Pro Subscribers"
              value={stats?.pro_subscribers?.toLocaleString() || "0"}
              description={`${stats?.plus_subscribers || 0} Plus, ${stats?.starter_subscribers || 0} Starter`}
              icon={TrendingUp}
            />
            <StatsCard
              title="MRR"
              value={formatCurrency(stats?.mrr || 0)}
              description={`ARPU: ${formatCurrency(stats?.arpu || 0)}`}
              icon={DollarSign}
            />
          </>
        )}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard
              title="AI Messages Today"
              value={stats?.ai_messages_today?.toLocaleString() || "0"}
              description={`${stats?.ai_tokens_today?.toLocaleString() || "0"} tokens`}
              icon={MessageSquare}
            />
            <StatsCard
              title="AI Cost Today"
              value={`$${stats?.ai_cost_today?.toFixed(2) || "0.00"}`}
              description="Estimated from token usage"
              icon={Cpu}
            />
            <StatsCard
              title="Trial Users"
              value={stats?.trial_users?.toLocaleString() || "0"}
              description={`${stats?.free_users || 0} free tier users`}
              icon={Clock}
            />
          </>
        )}
      </div>

      {/* User distribution */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          User Distribution by Tier
        </h2>
        {statsLoading ? (
          <div className="h-8 bg-slate-700 rounded animate-pulse" />
        ) : (
          <div className="flex h-8 rounded-lg overflow-hidden">
            {[
              { tier: "Pro", count: stats?.pro_subscribers || 0, color: "bg-brand-teal" },
              { tier: "Plus", count: stats?.plus_subscribers || 0, color: "bg-brand-cyan" },
              { tier: "Starter", count: stats?.starter_subscribers || 0, color: "bg-brand-cyan-light" },
              { tier: "Trial", count: stats?.trial_users || 0, color: "bg-brand-warning" },
              { tier: "Free", count: stats?.free_users || 0, color: "bg-slate-600" },
            ].map(({ tier, count, color }) => {
              const total = stats?.total_users || 1;
              const percent = (count / total) * 100;
              if (percent === 0) return null;

              return (
                <div
                  key={tier}
                  className={`${color} relative group`}
                  style={{ width: `${percent}%` }}
                  title={`${tier}: ${count} users (${percent.toFixed(1)}%)`}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-medium text-white">
                      {tier}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex items-center gap-6 mt-4 flex-wrap">
          {[
            { tier: "Pro", color: "bg-brand-teal", count: stats?.pro_subscribers },
            { tier: "Plus", color: "bg-brand-cyan", count: stats?.plus_subscribers },
            { tier: "Starter", color: "bg-brand-cyan-light", count: stats?.starter_subscribers },
            { tier: "Trial", color: "bg-brand-warning", count: stats?.trial_users },
            { tier: "Free", color: "bg-slate-600", count: stats?.free_users },
          ].map(({ tier, color, count }) => (
            <div key={tier} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${color}`} />
              <span className="text-sm text-slate-400">
                {tier}: {count || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/audit-log")}
            className="text-brand-cyan hover:text-brand-cyan/80 hover:bg-slate-800"
          >
            View All
          </Button>
        </div>
        <div className="divide-y divide-slate-800/50">
          {auditLoading ? (
            <div className="p-8 text-center text-slate-500">
              Loading activity...
            </div>
          ) : auditEntries.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No recent activity
            </div>
          ) : (
            auditEntries.slice(0, 5).map((entry) => (
              <AuditLogEntryRow key={entry.id} entry={entry} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
