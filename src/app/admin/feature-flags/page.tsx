"use client";

import { useState } from "react";
import { Plus, Flag, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureFlagRow, FeatureFlagRowSkeleton } from "@/components/admin/feature-flag-row";
import { CreateFlagDialog } from "@/components/admin/create-flag-dialog";
import { useFeatureFlags } from "@/lib/hooks/use-admin";
import type { FeatureFlag, FeatureFlagInput } from "@/lib/types/admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminFeatureFlagsPage() {
  const { flags, isLoading, error, createFlag, updateFlag, toggleFlag, deleteFlag } = useFeatureFlags();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (input: FeatureFlagInput) => {
    if (editingFlag) {
      await updateFlag(editingFlag.id, input);
    } else {
      await createFlag(input);
    }
  };

  const handleEdit = (flag: FeatureFlag) => {
    setEditingFlag(flag);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await deleteFlag(deleteConfirm);
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Failed to delete flag:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const flagToDelete = flags.find((f) => f.id === deleteConfirm);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Feature Flags</h1>
          <p className="text-slate-400 mt-1">
            Control feature rollout and availability
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingFlag(null);
            setIsCreateDialogOpen(true);
          }}
          className="bg-brand-teal hover:bg-brand-teal/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Flag
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-brand-alert/30 bg-brand-alert/10 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-brand-alert flex-shrink-0" />
          <p className="text-sm text-brand-alert">{error}</p>
        </div>
      )}

      {/* Flags list */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-800 bg-slate-800/30">
          <div className="w-11" /> {/* Toggle column */}
          <div className="flex-1 text-xs font-medium text-slate-500 uppercase tracking-wider">
            Flag
          </div>
          <div className="hidden md:block w-24 text-xs font-medium text-slate-500 uppercase tracking-wider">
            Scope
          </div>
          <div className="hidden lg:block w-28 text-xs font-medium text-slate-500 uppercase tracking-wider">
            Updated
          </div>
          <div className="w-20" /> {/* Actions column */}
        </div>

        {/* Loading state */}
        {isLoading && (
          <>
            <FeatureFlagRowSkeleton />
            <FeatureFlagRowSkeleton />
            <FeatureFlagRowSkeleton />
          </>
        )}

        {/* Empty state */}
        {!isLoading && flags.length === 0 && (
          <div className="p-12 text-center">
            <Flag className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No feature flags</h3>
            <p className="text-slate-500 mb-4">
              Create your first feature flag to control feature rollout.
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-brand-teal hover:bg-brand-teal/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Flag
            </Button>
          </div>
        )}

        {/* Flags */}
        {!isLoading &&
          flags.map((flag) => (
            <FeatureFlagRow
              key={flag.id}
              flag={flag}
              onToggle={toggleFlag}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteConfirm(id)}
            />
          ))}
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="text-sm font-medium text-white mb-2">How Feature Flags Work</h3>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>
            <strong className="text-slate-300">Global:</strong> Applies to all users regardless of tier.
          </li>
          <li>
            <strong className="text-slate-300">Tier-specific:</strong> Only applies to users on the selected tier.
          </li>
          <li>
            <strong className="text-slate-300">Rollout %:</strong> Percentage of eligible users who will see the feature.
          </li>
          <li>
            <strong className="text-slate-300">Note:</strong> Changes take effect within 1 minute (with client refresh).
          </li>
        </ul>
      </div>

      {/* Create/Edit dialog */}
      <CreateFlagDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setEditingFlag(null);
        }}
        onSubmit={handleSubmit}
        editingFlag={editingFlag}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Feature Flag</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete the flag{" "}
              <span className="text-white font-mono">{flagToDelete?.flag_name}</span>? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirm(null)}
              disabled={isDeleting}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-brand-alert hover:bg-brand-alert/90"
            >
              {isDeleting ? "Deleting..." : "Delete Flag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
