"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import type { MaintenanceTask, TaskType, TaskFrequency } from "@/types/database";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  tankId: string;
  task?: MaintenanceTask | null;
  onSuccess: () => void;
}

const TASK_TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: "water_change", label: "Water Change" },
  { value: "filter_cleaning", label: "Filter Cleaning" },
  { value: "feeding", label: "Feeding" },
  { value: "dosing", label: "Dosing" },
  { value: "equipment_maintenance", label: "Equipment Maintenance" },
  { value: "water_testing", label: "Water Testing" },
  { value: "custom", label: "Custom Task" },
];

const FREQUENCY_OPTIONS: { value: TaskFrequency; label: string }[] = [
  { value: "once", label: "One-time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom Interval" },
];

const TASK_TYPE_DEFAULTS: Record<TaskType, string> = {
  water_change: "Water Change",
  filter_cleaning: "Filter Cleaning",
  feeding: "Feeding",
  dosing: "Dosing",
  equipment_maintenance: "Equipment Maintenance",
  water_testing: "Water Testing",
  custom: "Custom Task",
};

export function CreateTaskModal({
  isOpen,
  onClose,
  tankId,
  task,
  onSuccess,
}: CreateTaskModalProps) {
  const isEditMode = !!task;

  const [type, setType] = useState<TaskType>("water_change");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<TaskFrequency>("weekly");
  const [customIntervalDays, setCustomIntervalDays] = useState<number | null>(null);
  const [reminderBeforeHours, setReminderBeforeHours] = useState(24);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form from task if editing
  useEffect(() => {
    if (task) {
      setType(task.type);
      setTitle(task.title);
      setDescription(task.description || "");
      setFrequency(task.frequency);
      setCustomIntervalDays(task.custom_interval_days);
      setReminderBeforeHours(task.reminder_before_hours);
    } else {
      // Reset form for new task
      setType("water_change");
      setTitle("");
      setDescription("");
      setFrequency("weekly");
      setCustomIntervalDays(null);
      setReminderBeforeHours(24);
    }
  }, [task, isOpen]);

  // Auto-fill title when type changes (only for new tasks)
  useEffect(() => {
    if (!isEditMode && !title) {
      setTitle(TASK_TYPE_DEFAULTS[type]);
    }
  }, [type, isEditMode, title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (frequency === "custom" && !customIntervalDays) {
      toast.error("Custom interval days is required for custom frequency");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditMode
        ? `/api/tanks/${tankId}/maintenance/${task.id}`
        : `/api/tanks/${tankId}/maintenance`;

      const method = isEditMode ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        type,
        title: title.trim(),
        frequency,
        reminder_before_hours: reminderBeforeHours,
      };

      if (description.trim()) {
        body.description = description.trim();
      }

      if (frequency === "custom" && customIntervalDays) {
        body.custom_interval_days = customIntervalDays;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(isEditMode ? "Task updated" : "Task created");
        onSuccess();
        onClose();
      } else {
        toast.error(data.error?.message || "Failed to save task");
      }
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task");
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
      <div className="relative bg-background rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {isEditMode ? "Edit Task" : "Create Task"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Task Type */}
            <div>
              <Label htmlFor="type" className="text-sm">
                Task Type *
              </Label>
              <Select
                id="type"
                value={type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as TaskType)}
                className="mt-1"
                required
              >
                {TASK_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-sm">
                Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Weekly Water Change"
                className="mt-1"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm">
                Description (optional)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any notes or instructions..."
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Frequency */}
            <div>
              <Label htmlFor="frequency" className="text-sm">
                Frequency *
              </Label>
              <Select
                id="frequency"
                value={frequency}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setFrequency(e.target.value as TaskFrequency);
                  if (e.target.value !== "custom") {
                    setCustomIntervalDays(null);
                  }
                }}
                className="mt-1"
                required
              >
                {FREQUENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Custom Interval Days */}
            {frequency === "custom" && (
              <div>
                <Label htmlFor="customIntervalDays" className="text-sm">
                  Interval (days) *
                </Label>
                <Input
                  id="customIntervalDays"
                  type="number"
                  min={1}
                  value={customIntervalDays || ""}
                  onChange={(e) =>
                    setCustomIntervalDays(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="e.g., 10"
                  className="mt-1"
                  required
                />
              </div>
            )}

            {/* Reminder Hours */}
            <div>
              <Label htmlFor="reminderBeforeHours" className="text-sm">
                Reminder Before (hours)
              </Label>
              <Input
                id="reminderBeforeHours"
                type="number"
                min={0}
                value={reminderBeforeHours}
                onChange={(e) =>
                  setReminderBeforeHours(parseInt(e.target.value) || 24)
                }
                className="mt-1"
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
              {isEditMode ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
