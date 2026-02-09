"use client";

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  X,
  ChevronRight,
  AlertTriangle,
  Info,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type TrendDirection = "increasing" | "decreasing" | "stable" | "spiking";
export type AlertSeverity = "info" | "warning" | "alert";

export interface ProactiveAlert {
  id: string;
  parameter: string;
  current_value: number;
  unit: string;
  trend_direction: TrendDirection;
  projection_text: string;
  likely_cause?: string;
  suggested_action?: string;
  severity: AlertSeverity;
}

export interface ProactiveAlertCardProps {
  alert: ProactiveAlert;
  onDismiss?: (id: string) => void;
  onTakeAction?: (action: string) => void;
  className?: string;
}

const SEVERITY_STYLES: Record<
  AlertSeverity,
  { borderColor: string; bgColor: string; textColor: string; icon: React.ElementType }
> = {
  info: {
    borderColor: "#00B4D8", // brand-cyan
    bgColor: "bg-[#00B4D8]/10",
    textColor: "text-[#00B4D8]",
    icon: Info,
  },
  warning: {
    borderColor: "#F59E0B", // amber-500
    bgColor: "bg-[#F59E0B]/10",
    textColor: "text-[#F59E0B]",
    icon: AlertTriangle,
  },
  alert: {
    borderColor: "#FF6B6B", // brand-alert
    bgColor: "bg-[#FF6B6B]/10",
    textColor: "text-[#FF6B6B]",
    icon: AlertCircle,
  },
};

const TREND_ICONS: Record<TrendDirection, React.ElementType> = {
  increasing: TrendingUp,
  decreasing: TrendingDown,
  stable: Minus,
  spiking: Zap,
};

export function ProactiveAlertCard({
  alert,
  onDismiss,
  onTakeAction,
  className,
}: ProactiveAlertCardProps) {
  const severityStyle = SEVERITY_STYLES[alert.severity];
  const TrendIcon = TREND_ICONS[alert.trend_direction];
  const SeverityIcon = severityStyle.icon;

  return (
    <div
      className={cn(
        "bg-white border-l-4 rounded-2xl shadow-sm p-4 relative",
        className
      )}
      style={{ borderLeftColor: severityStyle.borderColor }}
    >
      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={() => onDismiss(alert.id)}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      )}

      {/* Header with parameter name and severity */}
      <div className="flex items-start gap-3 mb-3 pr-8">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            severityStyle.bgColor
          )}
        >
          <SeverityIcon className={cn("w-5 h-5", severityStyle.textColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-[#0A2463] truncate">{alert.parameter}</h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                severityStyle.bgColor,
                severityStyle.textColor
              )}
            >
              {alert.severity}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[#0A2463]">
              {alert.current_value}
              {alert.unit && <span className="text-sm font-normal text-gray-500 ml-1">{alert.unit}</span>}
            </span>
            <TrendIcon className={cn("w-4 h-4", severityStyle.textColor)} />
          </div>
        </div>
      </div>

      {/* Projection text */}
      <div className="mb-3">
        <p className="text-sm text-gray-700">{alert.projection_text}</p>
      </div>

      {/* Likely cause */}
      {alert.likely_cause && (
        <div className="bg-gray-50 rounded-xl p-3 mb-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Likely Cause</p>
          <p className="text-sm text-gray-700">{alert.likely_cause}</p>
        </div>
      )}

      {/* Suggested action button */}
      {alert.suggested_action && onTakeAction && (
        <Button
          variant="ghost"
          onClick={() => onTakeAction(alert.suggested_action!)}
          className={cn(
            "w-full justify-between text-left h-auto py-2 px-3 rounded-xl",
            severityStyle.bgColor,
            severityStyle.textColor,
            "hover:opacity-80"
          )}
        >
          <span className="text-sm font-medium">{alert.suggested_action}</span>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
        </Button>
      )}
    </div>
  );
}
