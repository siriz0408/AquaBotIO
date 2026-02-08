"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { MaintenanceTask } from "@/types/database";

interface CompleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: MaintenanceTask;
  onSuccess: () => void;
}

export function CompleteTaskModal({
  isOpen,
  onClose,
  task,
  onSuccess,
}: CompleteTaskModalProps) {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/tanks/${task.tank_id}/maintenance/${task.id}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes: notes.trim() || undefined,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Task completed!");
        onSuccess();
        onClose();
        setNotes("");
      } else {
        toast.error(data.error?.message || "Failed to complete task");
      }
    } catch (error) {
      console.error("Error completing task:", error);
      toast.error("Failed to complete task");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold">Complete Task</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">{task.title}</p>
              <p className="text-xs text-muted-foreground">
                Mark this task as completed
              </p>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-sm">
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this completion..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Complete
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
