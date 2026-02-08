"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, CheckCircle2, Edit } from "lucide-react";
import type { MaintenanceTask, MaintenanceLog } from "@/types/database";

interface TaskCardProps {
  task: MaintenanceTask;
  logs?: MaintenanceLog[];
  onComplete: (taskId: string) => void;
  onEdit: (task: MaintenanceTask) => void;
}

const TASK_TYPE_ICONS: Record<string, string> = {
  water_change: "💧",
  filter_cleaning: "🔧",
  feeding: "🐟",
  dosing: "💊",
  equipment_maintenance: "⚙️",
  water_testing: "🧪",
  custom: "📝",
};

const FREQUENCY_LABELS: Record<string, string> = {
  once: "One-time",
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  custom: "Custom",
};

function getTaskStatus(task: MaintenanceTask): {
  status: "overdue" | "due_today" | "upcoming";
  label: string;
  color: string;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(task.next_due_date);
  dueDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return {
      status: "overdue",
      label: `${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? "day" : "days"} overdue`,
      color: "text-red-500 border-red-500",
    };
  } else if (diffDays === 0) {
    return {
      status: "due_today",
      label: "Due today",
      color: "text-yellow-500 border-yellow-500",
    };
  } else {
    return {
      status: "upcoming",
      label: `Due in ${diffDays} ${diffDays === 1 ? "day" : "days"}`,
      color: "text-green-500 border-green-500",
    };
  }
}

export function TaskCard({ task, logs = [], onComplete, onEdit }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const status = getTaskStatus(task);
  const recentLogs = logs.slice(0, 3);

  return (
    <Card className={`border-l-4 ${status.color}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="text-2xl shrink-0">
            {TASK_TYPE_ICONS[task.type] || "📝"}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{task.title}</h3>
                {task.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {FREQUENCY_LABELS[task.frequency] || task.frequency}
              </Badge>
              <span className={`text-xs font-medium ${status.color.replace("border-", "")}`}>
                {status.label}
              </span>
            </div>

            {/* Recent completion history */}
            {isExpanded && recentLogs.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Recent completions
                </p>
                <div className="space-y-1.5">
                  {recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span>
                        {formatDistanceToNow(new Date(log.completed_at), {
                          addSuffix: true,
                        })}
                      </span>
                      {log.notes && (
                        <span className="truncate">— {log.notes}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComplete(task.id)}
              className="h-8 text-xs"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Complete
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(task)}
              className="h-8 w-8"
            >
              <Edit className="h-3 w-3" />
            </Button>
            {logs.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8"
              >
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
