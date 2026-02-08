"use client";

import Link from "next/link";
import { FlaskConical, Plus, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: typeof FlaskConical;
  label: string;
  color: string;
  href: string;
}

interface QuickActionsProps {
  tankId?: string;
  className?: string;
}

export function QuickActions({ tankId, className }: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      icon: FlaskConical,
      label: "Log Parameters",
      color: "#1B998B",
      href: tankId ? `/tanks/${tankId}/log` : "/dashboard",
    },
    {
      icon: Plus,
      label: "Add Livestock",
      color: "#0A2540",
      href: tankId ? `/tanks/${tankId}/livestock` : "/dashboard",
    },
    {
      icon: CalendarPlus,
      label: "Schedule Task",
      color: "#1B998B",
      href: tankId ? `/tanks/${tankId}/maintenance` : "/dashboard",
    },
  ];

  return (
    <div className={cn("px-4", className)}>
      <div className="grid grid-cols-3 gap-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-2 active:scale-95"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${action.color}15` }}
            >
              <action.icon className="w-6 h-6" style={{ color: action.color }} />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center leading-tight">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
