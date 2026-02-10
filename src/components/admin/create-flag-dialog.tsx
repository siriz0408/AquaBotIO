"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { FeatureFlag, FeatureFlagInput, FeatureFlagScope, UserTier } from "@/lib/types/admin";

interface CreateFlagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: FeatureFlagInput) => Promise<void>;
  editingFlag?: FeatureFlag | null;
}

export function CreateFlagDialog({
  open,
  onOpenChange,
  onSubmit,
  editingFlag,
}: CreateFlagDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flagName, setFlagName] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [scope, setScope] = useState<FeatureFlagScope>("global");
  const [tier, setTier] = useState<UserTier>("free");
  const [rolloutPercent, setRolloutPercent] = useState(100);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or editing flag changes
  useEffect(() => {
    if (open) {
      if (editingFlag) {
        setFlagName(editingFlag.flag_name);
        setDescription(editingFlag.description || "");
        setEnabled(editingFlag.enabled);
        setScope(editingFlag.scope);
        setTier(editingFlag.tier || "free");
        setRolloutPercent(editingFlag.rollout_percent);
      } else {
        setFlagName("");
        setDescription("");
        setEnabled(false);
        setScope("global");
        setTier("free");
        setRolloutPercent(100);
      }
      setError(null);
    }
  }, [open, editingFlag]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!flagName.trim()) {
      setError("Flag name is required");
      return;
    }

    // Validate flag name format (snake_case)
    if (!/^[a-z][a-z0-9_]*$/.test(flagName)) {
      setError("Flag name must be in snake_case format (e.g., my_feature_flag)");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        flag_name: flagName,
        description: description || undefined,
        enabled,
        scope,
        tier: scope === "tier_specific" ? tier : undefined,
        rollout_percent: rolloutPercent,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save flag");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editingFlag ? "Edit Feature Flag" : "Create Feature Flag"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {editingFlag
              ? "Update the feature flag settings below."
              : "Add a new feature flag to control feature rollout."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Flag Name */}
          <div className="space-y-2">
            <Label htmlFor="flag-name" className="text-slate-300">
              Flag Name
            </Label>
            <Input
              id="flag-name"
              value={flagName}
              onChange={(e) => setFlagName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
              placeholder="my_feature_flag"
              disabled={isSubmitting || !!editingFlag}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-brand-cyan"
            />
            <p className="text-xs text-slate-500">
              Use snake_case format (letters, numbers, underscores)
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-300">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this feature flag"
              disabled={isSubmitting}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-brand-cyan"
            />
          </div>

          {/* Enabled */}
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled" className="text-slate-300">
              Enabled
            </Label>
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={isSubmitting}
              className="data-[state=checked]:bg-brand-teal"
            />
          </div>

          {/* Scope */}
          <div className="space-y-2">
            <Label className="text-slate-300">Scope</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setScope("global")}
                disabled={isSubmitting}
                className={cn(
                  "flex-1 border-slate-700",
                  scope === "global"
                    ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan"
                    : "bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                Global
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setScope("tier_specific")}
                disabled={isSubmitting}
                className={cn(
                  "flex-1 border-slate-700",
                  scope === "tier_specific"
                    ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan"
                    : "bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                Tier-specific
              </Button>
            </div>
          </div>

          {/* Tier selector (when scope is tier_specific) */}
          {scope === "tier_specific" && (
            <div className="space-y-2">
              <Label className="text-slate-300">Target Tier</Label>
              <div className="grid grid-cols-4 gap-2">
                {(["free", "starter", "plus", "pro"] as UserTier[]).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTier(t)}
                    disabled={isSubmitting}
                    className={cn(
                      "border-slate-700 capitalize",
                      tier === t
                        ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan"
                        : "bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Rollout Percent */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="rollout" className="text-slate-300">
                Rollout Percentage
              </Label>
              <span className="text-sm text-brand-cyan">{rolloutPercent}%</span>
            </div>
            <input
              id="rollout"
              type="range"
              min={0}
              max={100}
              step={5}
              value={rolloutPercent}
              onChange={(e) => setRolloutPercent(Number(e.target.value))}
              disabled={isSubmitting}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
            />
            <p className="text-xs text-slate-500">
              Percentage of users who will see this feature
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-brand-alert bg-brand-alert/10 border border-brand-alert/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-teal hover:bg-brand-teal/90 text-white"
            >
              {isSubmitting
                ? "Saving..."
                : editingFlag
                ? "Update Flag"
                : "Create Flag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
