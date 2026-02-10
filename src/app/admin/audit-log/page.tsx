"use client";

import { useState, useMemo } from "react";
import { Filter, X, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuditLogEntryRow } from "@/components/admin/audit-log-entry";
import { useAuditLog } from "@/lib/hooks/use-admin";
import { cn } from "@/lib/utils";
import type { AdminAction, AuditLogFilters } from "@/lib/types/admin";

// Group actions by category for filter UI
const actionCategories = {
  User: [
    "user_created",
    "user_updated",
    "user_suspended",
    "user_unsuspended",
    "user_banned",
    "user_deleted",
  ],
  Subscription: [
    "subscription_updated",
    "trial_extended",
    "credit_issued",
    "tier_changed",
  ],
  Content: [
    "species_added",
    "species_updated",
    "species_deleted",
    "equipment_added",
    "equipment_updated",
    "equipment_deleted",
    "prompt_created",
    "prompt_updated",
    "prompt_activated",
  ],
  System: [
    "feature_flag_created",
    "feature_flag_updated",
    "feature_flag_deleted",
    "tier_config_updated",
    "maintenance_mode_toggled",
  ],
  Admin: [
    "admin_invited",
    "admin_role_changed",
    "admin_revoked",
    "impersonation_started",
    "impersonation_ended",
  ],
};

export default function AdminAuditLogPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { entries, isLoading, error, refresh } = useAuditLog(filters);

  // Get unique admin emails for filter
  const adminEmails = useMemo(() => {
    const emails = new Set(entries.map((e) => e.admin_email));
    return Array.from(emails).filter((e) => e !== "Unknown");
  }, [entries]);

  // Update filters
  const updateFilters = (newFilters: Partial<AuditLogFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setSelectedCategory(null);
  };

  const hasActiveFilters =
    filters.admin_user_id ||
    filters.action ||
    filters.resource_type ||
    filters.start_date ||
    filters.end_date;

  // Get actions in selected category
  const categoryActions = selectedCategory
    ? actionCategories[selectedCategory as keyof typeof actionCategories] || []
    : [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-slate-400 mt-1">
            Track all administrative actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "border-slate-700",
              showFilters || hasActiveFilters
                ? "bg-brand-cyan/10 border-brand-cyan text-brand-cyan"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 h-2 w-2 rounded-full bg-brand-cyan" />
            )}
          </Button>
          <Button
            onClick={refresh}
            variant="outline"
            className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">Filters</span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date range */}
            <div>
              <label className="block text-xs text-slate-500 mb-2">From Date</label>
              <Input
                type="date"
                value={filters.start_date || ""}
                onChange={(e) =>
                  updateFilters({ start_date: e.target.value || undefined })
                }
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-2">To Date</label>
              <Input
                type="date"
                value={filters.end_date || ""}
                onChange={(e) =>
                  updateFilters({ end_date: e.target.value || undefined })
                }
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {/* Resource type */}
            <div>
              <label className="block text-xs text-slate-500 mb-2">Resource Type</label>
              <div className="flex flex-wrap gap-2">
                {["user", "subscription", "species", "feature_flag"].map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateFilters({
                        resource_type: filters.resource_type === type ? undefined : type,
                      })
                    }
                    className={cn(
                      "border-slate-700 capitalize text-xs",
                      filters.resource_type === type
                        ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    {type.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>

            {/* Admin filter (if we have admin emails) */}
            {adminEmails.length > 0 && (
              <div>
                <label className="block text-xs text-slate-500 mb-2">Admin</label>
                <select
                  value=""
                  onChange={(_e) => {
                    // Would need to map email back to user_id
                    // For now, this is a placeholder
                  }}
                  className="w-full h-9 rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-white"
                >
                  <option value="">All admins</option>
                  {adminEmails.map((email) => (
                    <option key={email} value={email}>
                      {email}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action category filter */}
          <div>
            <label className="block text-xs text-slate-500 mb-2">Action Category</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(actionCategories).map((category) => (
                <Button
                  key={category}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedCategory === category) {
                      setSelectedCategory(null);
                      updateFilters({ action: undefined });
                    } else {
                      setSelectedCategory(category);
                    }
                  }}
                  className={cn(
                    "border-slate-700",
                    selectedCategory === category
                      ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Action type filter (when category selected) */}
          {selectedCategory && categoryActions.length > 0 && (
            <div>
              <label className="block text-xs text-slate-500 mb-2">Action Type</label>
              <div className="flex flex-wrap gap-2">
                {categoryActions.map((action) => (
                  <Button
                    key={action}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateFilters({
                        action: filters.action === action ? undefined : (action as AdminAction),
                      })
                    }
                    className={cn(
                      "border-slate-700 text-xs",
                      filters.action === action
                        ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    {action.replace(/_/g, " ")}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-brand-alert/30 bg-brand-alert/10 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-brand-alert flex-shrink-0" />
          <p className="text-sm text-brand-alert">{error}</p>
        </div>
      )}

      {/* Results count */}
      {!isLoading && (
        <div className="text-sm text-slate-500">
          Showing {entries.length} entries
        </div>
      )}

      {/* Audit log entries */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        {/* Header */}
        <div className="hidden md:flex items-center gap-4 px-4 py-3 border-b border-slate-800 bg-slate-800/30 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <div className="min-w-[160px]">Timestamp</div>
          <div className="min-w-[180px]">Admin</div>
          <div className="min-w-[140px]">Action</div>
          <div className="flex-1">Target</div>
          <div className="w-6" />
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="p-8 text-center text-slate-500">Loading audit log...</div>
        )}

        {/* Empty state */}
        {!isLoading && entries.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No audit entries</h3>
            <p className="text-slate-500">
              {hasActiveFilters
                ? "No entries match your filters. Try adjusting your criteria."
                : "Admin actions will appear here."}
            </p>
          </div>
        )}

        {/* Entries */}
        {!isLoading && entries.length > 0 && (
          <div className="divide-y divide-slate-800/50">
            {entries.map((entry) => (
              <AuditLogEntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="text-sm font-medium text-white mb-2">About Audit Logs</h3>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>All admin actions are logged before execution for compliance.</li>
          <li>Logs include IP address and user agent for security review.</li>
          <li>Data changes capture before/after snapshots (click to expand).</li>
          <li>Logs are immutable and retained for 2+ years per policy.</li>
        </ul>
      </div>
    </div>
  );
}
