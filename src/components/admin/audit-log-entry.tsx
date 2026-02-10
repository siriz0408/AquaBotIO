"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, User, Clock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { AuditLogEntry } from "@/lib/types/admin";

interface AuditLogEntryRowProps {
  entry: AuditLogEntry;
}

// Action type styling
const actionStyles: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  user_created: { label: "User Created", variant: "default" },
  user_updated: { label: "User Updated", variant: "secondary" },
  user_suspended: { label: "User Suspended", variant: "destructive" },
  user_unsuspended: { label: "User Unsuspended", variant: "default" },
  user_banned: { label: "User Banned", variant: "destructive" },
  user_deleted: { label: "User Deleted", variant: "destructive" },
  subscription_updated: { label: "Subscription Updated", variant: "secondary" },
  trial_extended: { label: "Trial Extended", variant: "default" },
  credit_issued: { label: "Credit Issued", variant: "default" },
  tier_changed: { label: "Tier Changed", variant: "secondary" },
  species_added: { label: "Species Added", variant: "default" },
  species_updated: { label: "Species Updated", variant: "secondary" },
  species_deleted: { label: "Species Deleted", variant: "destructive" },
  equipment_added: { label: "Equipment Added", variant: "default" },
  equipment_updated: { label: "Equipment Updated", variant: "secondary" },
  equipment_deleted: { label: "Equipment Deleted", variant: "destructive" },
  prompt_created: { label: "Prompt Created", variant: "default" },
  prompt_updated: { label: "Prompt Updated", variant: "secondary" },
  prompt_activated: { label: "Prompt Activated", variant: "default" },
  feature_flag_created: { label: "Flag Created", variant: "default" },
  feature_flag_updated: { label: "Flag Updated", variant: "secondary" },
  feature_flag_deleted: { label: "Flag Deleted", variant: "destructive" },
  tier_config_updated: { label: "Tier Config Updated", variant: "secondary" },
  admin_invited: { label: "Admin Invited", variant: "default" },
  admin_role_changed: { label: "Admin Role Changed", variant: "secondary" },
  admin_revoked: { label: "Admin Revoked", variant: "destructive" },
  maintenance_mode_toggled: { label: "Maintenance Toggled", variant: "secondary" },
  impersonation_started: { label: "Impersonation Started", variant: "outline" },
  impersonation_ended: { label: "Impersonation Ended", variant: "outline" },
};

export function AuditLogEntryRow({ entry }: AuditLogEntryRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const actionStyle = actionStyles[entry.action] || { label: entry.action, variant: "secondary" as const };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasDetails =
    entry.changes_before ||
    entry.changes_after ||
    entry.ip_address ||
    entry.user_agent;

  return (
    <div className="border-b border-slate-800/50 last:border-b-0">
      <div
        className={cn(
          "flex items-center gap-4 px-4 py-3 transition-colors",
          hasDetails && "cursor-pointer hover:bg-slate-800/30"
        )}
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
      >
        {/* Timestamp */}
        <div className="flex items-center gap-2 text-sm text-slate-400 min-w-[160px]">
          <Clock className="h-4 w-4" />
          <span>{formatDate(entry.created_at)}</span>
        </div>

        {/* Admin */}
        <div className="flex items-center gap-2 text-sm text-slate-300 min-w-[180px]">
          <User className="h-4 w-4 text-slate-500" />
          <span className="truncate">{entry.admin_email}</span>
        </div>

        {/* Action */}
        <div className="min-w-[140px]">
          <Badge
            variant={actionStyle.variant}
            className={cn(
              actionStyle.variant === "default" && "bg-brand-teal/20 text-brand-teal border-brand-teal/30",
              actionStyle.variant === "secondary" && "bg-slate-700 text-slate-300 border-slate-600",
              actionStyle.variant === "destructive" && "bg-brand-alert/20 text-brand-alert border-brand-alert/30",
              actionStyle.variant === "outline" && "bg-transparent text-slate-400 border-slate-600"
            )}
          >
            {actionStyle.label}
          </Badge>
        </div>

        {/* Target */}
        <div className="flex-1 text-sm text-slate-400 truncate">
          {entry.resource_type && (
            <span>
              {entry.resource_type}
              {entry.resource_id && (
                <span className="text-slate-500">: {entry.resource_id}</span>
              )}
            </span>
          )}
        </div>

        {/* Expand indicator */}
        {hasDetails && (
          <div className="text-slate-500">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && hasDetails && (
        <div className="px-4 py-4 bg-slate-800/20 border-t border-slate-800/50 space-y-4">
          {/* IP and User Agent */}
          {(entry.ip_address || entry.user_agent) && (
            <div className="flex items-start gap-6 text-sm">
              {entry.ip_address && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-400">{entry.ip_address}</span>
                </div>
              )}
              {entry.user_agent && (
                <div className="text-slate-500 text-xs truncate max-w-md">
                  {entry.user_agent}
                </div>
              )}
            </div>
          )}

          {/* Before/After changes */}
          {(entry.changes_before || entry.changes_after) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entry.changes_before && (
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
                    Before
                  </div>
                  <pre className="text-xs text-slate-400 bg-slate-900 rounded-lg p-3 overflow-x-auto">
                    {JSON.stringify(entry.changes_before, null, 2)}
                  </pre>
                </div>
              )}
              {entry.changes_after && (
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
                    After
                  </div>
                  <pre className="text-xs text-slate-400 bg-slate-900 rounded-lg p-3 overflow-x-auto">
                    {JSON.stringify(entry.changes_after, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
