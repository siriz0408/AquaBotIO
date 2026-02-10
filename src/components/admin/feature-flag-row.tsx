"use client";

import { useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FeatureFlag } from "@/lib/types/admin";

interface FeatureFlagRowProps {
  flag: FeatureFlag;
  onToggle: (id: string) => Promise<void>;
  onEdit: (flag: FeatureFlag) => void;
  onDelete: (id: string) => void;
}

export function FeatureFlagRow({ flag, onToggle, onEdit, onDelete }: FeatureFlagRowProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggle(flag.id);
    } finally {
      setIsToggling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex items-center gap-4 px-4 py-4 border-b border-slate-800/50 last:border-b-0 hover:bg-slate-800/30 transition-colors">
      {/* Toggle switch */}
      <div className="flex-shrink-0">
        <Switch
          checked={flag.enabled}
          onCheckedChange={handleToggle}
          disabled={isToggling}
          className={cn(
            "data-[state=checked]:bg-brand-teal",
            isToggling && "opacity-50"
          )}
          aria-label={`Toggle ${flag.flag_name}`}
        />
      </div>

      {/* Flag name and description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">
            {flag.flag_name}
          </span>
          {flag.scope === "tier_specific" && flag.tier && (
            <Badge
              variant="outline"
              className="text-xs bg-transparent text-slate-400 border-slate-600"
            >
              {flag.tier}
            </Badge>
          )}
          {flag.rollout_percent < 100 && (
            <Badge
              variant="outline"
              className="text-xs bg-brand-warning/10 text-brand-warning border-brand-warning/30"
            >
              {flag.rollout_percent}% rollout
            </Badge>
          )}
        </div>
        {flag.description && (
          <p className="text-sm text-slate-500 truncate">{flag.description}</p>
        )}
      </div>

      {/* Scope */}
      <div className="hidden md:block w-24">
        <span
          className={cn(
            "text-xs",
            flag.scope === "global" ? "text-slate-400" : "text-brand-cyan"
          )}
        >
          {flag.scope === "global" ? "Global" : "Tier-specific"}
        </span>
      </div>

      {/* Updated date */}
      <div className="hidden lg:block w-28 text-sm text-slate-500">
        {formatDate(flag.updated_at)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(flag)}
          className="h-9 w-9 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
          aria-label={`Edit ${flag.flag_name}`}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(flag.id)}
          className="h-9 w-9 p-0 text-slate-400 hover:text-brand-alert hover:bg-brand-alert/10"
          aria-label={`Delete ${flag.flag_name}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function FeatureFlagRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-4 border-b border-slate-800/50 animate-pulse">
      <div className="h-6 w-11 bg-slate-700 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 bg-slate-700 rounded" />
        <div className="h-3 w-64 bg-slate-700/50 rounded" />
      </div>
      <div className="h-4 w-20 bg-slate-700 rounded hidden md:block" />
      <div className="h-4 w-24 bg-slate-700 rounded hidden lg:block" />
      <div className="flex gap-1">
        <div className="h-9 w-9 bg-slate-700 rounded" />
        <div className="h-9 w-9 bg-slate-700 rounded" />
      </div>
    </div>
  );
}
