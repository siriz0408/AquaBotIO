"use client";

import { useState } from "react";
import { Fish, CheckCircle2, Circle, Bell, BookOpen, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Default quarantine steps
const DEFAULT_STEPS = [
  {
    id: "setup_tank",
    label: "Set up 10-20 gallon quarantine tank",
    description: "A separate tank with heater, filter, and basic setup",
  },
  {
    id: "cycle_tank",
    label: "Ensure tank is cycled (ammonia/nitrite = 0)",
    description: "Use established filter media or bacteria starter",
  },
  {
    id: "acclimate",
    label: "Drip acclimate new fish",
    description: "Match temperature and water chemistry slowly over 1-2 hours",
  },
  {
    id: "observe_week1",
    label: "Week 1: Daily observation",
    description: "Watch for signs of disease, stress, or parasites",
  },
  {
    id: "observe_week2",
    label: "Week 2: Continue monitoring",
    description: "Check for late-developing symptoms",
  },
  {
    id: "treat_if_needed",
    label: "Treat any issues if detected",
    description: "Medicate in quarantine, not your main tank",
  },
  {
    id: "transfer",
    label: "Transfer to main tank",
    description: "Only when fish is healthy and eating well for 2+ weeks",
  },
];

export interface QuarantineChecklistData {
  id?: string; // Database ID if persisted
  speciesName: string;
  tankName: string;
  tankId: string;
  startDate?: string;
  stepsCompleted?: string[];
  sensitivityLevel?: "low" | "medium" | "high";
  customSteps?: Array<{ id: string; label: string; description?: string }>;
  personalizedTips?: string[];
}

interface QuarantineChecklistProps {
  data: QuarantineChecklistData;
  onStepToggle?: (stepId: string, completed: boolean) => void;
  onScheduleReminders?: () => void;
  className?: string;
}

export function QuarantineChecklistWidget({
  data,
  onStepToggle,
  onScheduleReminders,
  className,
}: QuarantineChecklistProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(
    new Set(data.stepsCompleted || [])
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  // Use custom steps if provided, otherwise use defaults
  const steps = data.customSteps || DEFAULT_STEPS;
  const completedCount = completedSteps.size;
  const totalSteps = steps.length;
  const progress = Math.round((completedCount / totalSteps) * 100);

  // Sensitivity-based styling
  const sensitivityColors = {
    low: "from-green-500 to-emerald-500",
    medium: "from-amber-500 to-orange-500",
    high: "from-red-500 to-rose-500",
  };

  const sensitivityBadge = {
    low: { bg: "bg-green-100", text: "text-green-700", label: "Hardy Species" },
    medium: { bg: "bg-amber-100", text: "text-amber-700", label: "Moderate Care" },
    high: { bg: "bg-red-100", text: "text-red-700", label: "Sensitive Species" },
  };

  const sensitivity = data.sensitivityLevel || "medium";

  // Toggle step completion
  const handleToggleStep = async (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    const isNowCompleted = !completedSteps.has(stepId);

    if (isNowCompleted) {
      newCompleted.add(stepId);
    } else {
      newCompleted.delete(stepId);
    }

    setCompletedSteps(newCompleted);

    // Persist to database if we have an ID
    if (data.id) {
      setIsSaving(true);
      try {
        const response = await fetch("/api/quarantine", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: data.id,
            steps_completed: Array.from(newCompleted),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save progress");
        }

        if (onStepToggle) {
          onStepToggle(stepId, isNowCompleted);
        }

        // Check if all steps completed
        if (newCompleted.size === steps.length) {
          toast.success("Quarantine complete! Your fish is ready for the main tank.");
        }
      } catch {
        toast.error("Failed to save progress");
        // Revert on error
        setCompletedSteps(completedSteps);
      } finally {
        setIsSaving(false);
      }
    } else if (onStepToggle) {
      onStepToggle(stepId, isNowCompleted);
    }
  };

  // Schedule reminders
  const handleScheduleReminders = async () => {
    setIsScheduling(true);
    try {
      const response = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tank_id: data.tankId,
          task_type: "water_testing",
          title: `Quarantine check: ${data.speciesName}`,
          notes: "Daily parameter check for quarantine tank",
          frequency: "daily",
          next_due_date: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast.success("Daily reminders scheduled for quarantine monitoring");
        if (onScheduleReminders) {
          onScheduleReminders();
        }
      } else {
        throw new Error("Failed to schedule reminders");
      }
    } catch {
      toast.error("Failed to schedule reminders");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden", className)}>
      {/* Header */}
      <div className={cn("bg-gradient-to-r px-4 py-3", sensitivityColors[sensitivity])}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Fish className="w-5 h-5" />
            <h3 className="font-bold">Quarantine Checklist</h3>
          </div>
          <div className={cn("px-2 py-0.5 rounded-full text-xs font-medium", sensitivityBadge[sensitivity].bg, sensitivityBadge[sensitivity].text)}>
            {sensitivityBadge[sensitivity].label}
          </div>
        </div>
      </div>

      {/* Species Info */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Species:</p>
            <p className="font-semibold text-brand-navy">{data.speciesName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Destination:</p>
            <p className="font-semibold text-brand-navy">{data.tankName}</p>
          </div>
        </div>
        {data.startDate && (
          <p className="text-xs text-gray-500 mt-2">
            Started: {new Date(data.startDate).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-bold text-brand-teal">
            {completedCount}/{totalSteps} steps
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-teal transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="px-4 pb-3 space-y-2">
        {steps.map((step) => {
          const isCompleted = completedSteps.has(step.id);
          return (
            <button
              key={step.id}
              onClick={() => handleToggleStep(step.id)}
              disabled={isSaving}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors",
                isCompleted
                  ? "bg-green-50 border border-green-100"
                  : "bg-gray-50 border border-gray-100 hover:bg-gray-100"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isCompleted ? "text-green-700 line-through" : "text-gray-700"
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Personalized Tips */}
      {data.personalizedTips && data.personalizedTips.length > 0 && (
        <div className="px-4 pb-3">
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <p className="text-xs font-semibold text-amber-700">
                Tips for {data.speciesName}:
              </p>
            </div>
            <ul className="space-y-1">
              {data.personalizedTips.map((tip, index) => (
                <li key={index} className="text-xs text-amber-700 flex items-start gap-1">
                  <span>•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 pb-4 space-y-2">
        <Button
          onClick={handleScheduleReminders}
          disabled={isScheduling}
          variant="outline"
          className="w-full"
        >
          <Bell className="w-4 h-4 mr-2" />
          {isScheduling ? "Scheduling..." : "Schedule Daily Reminders"}
        </Button>
        <Button
          variant="ghost"
          className="w-full text-gray-600"
          onClick={() => window.open("https://www.aquariumcoop.com/blogs/aquarium/quarantine-fish", "_blank")}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Learn More About Quarantine
        </Button>
      </div>
    </div>
  );
}
