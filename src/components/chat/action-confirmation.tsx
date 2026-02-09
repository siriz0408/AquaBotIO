"use client";

import { useState } from "react";
import { FlaskConical, Fish, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ActionType =
  | "log_parameters"
  | "add_livestock"
  | "schedule_maintenance"
  | "complete_maintenance";

export interface ActionPayload {
  type: ActionType;
  description: string;
  payload: Record<string, unknown>;
}

export interface ActionConfirmationProps {
  action: ActionPayload;
  tankId: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isPending?: boolean;
  className?: string;
}

const ACTION_CONFIG: Record<ActionType, { icon: React.ElementType; label: string }> = {
  log_parameters: {
    icon: FlaskConical,
    label: "Log Parameters",
  },
  add_livestock: {
    icon: Fish,
    label: "Add Livestock",
  },
  schedule_maintenance: {
    icon: Calendar,
    label: "Schedule Maintenance",
  },
  complete_maintenance: {
    icon: CheckCircle2,
    label: "Complete Maintenance",
  },
};

export function ActionConfirmation({
  action,
  onConfirm,
  onCancel,
  isPending = false,
  className,
}: ActionConfirmationProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const config = ACTION_CONFIG[action.type];
  const Icon = config?.icon || FlaskConical;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  const loading = isPending || isConfirming;

  return (
    <div
      className={cn(
        "bg-white border-l-4 border-[#1B998B] rounded-2xl shadow-sm p-4",
        className
      )}
    >
      {/* Header with icon and type */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#1B998B]/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-[#1B998B]" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Action Request
          </p>
          <h3 className="font-semibold text-[#0A2463]">{config?.label || action.type}</h3>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-700 mb-4 pl-[52px]">{action.description}</p>

      {/* Payload preview (optional, shows what will be saved) */}
      {Object.keys(action.payload).length > 0 && (
        <div className="bg-gray-50 rounded-xl p-3 mb-4 ml-[52px]">
          <p className="text-xs font-medium text-gray-500 mb-2">Data to save:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(action.payload).map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center px-2 py-1 bg-white rounded-lg text-xs border border-gray-200"
              >
                <span className="text-gray-500">{key}:</span>
                <span className="ml-1 font-medium text-[#0A2463]">
                  {String(value)}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pl-[52px]">
        <Button
          onClick={handleConfirm}
          disabled={loading}
          className="bg-[#1B998B] hover:bg-[#1B998B]/90 text-white rounded-xl"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Confirming...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm</span>
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="rounded-xl border-gray-300"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
