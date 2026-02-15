"use client";

import Link from "next/link";
import { ChevronDown, Bell, Settings, Lightbulb, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  tankName?: string;
  onTankSelect?: () => void;
  hasNotifications?: boolean;
  className?: string;
}

export function TopBar({
  tankName = "Select Tank",
  onTankSelect,
  hasNotifications = false,
  className,
}: TopBarProps) {
  return (
    <header className={cn("bg-white shadow-sm sticky top-0 z-30", className)}>
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Tank Selector */}
        <button
          onClick={onTankSelect}
          aria-label={`Current tank: ${tankName}. Click to change tank`}
          aria-haspopup="listbox"
          className={cn(
            "flex items-center gap-2 bg-gray-100 px-4 py-2 min-h-[44px] rounded-xl",
            "hover:bg-gray-200 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2"
          )}
        >
          <span className="font-semibold text-brand-navy">{tankName}</span>
          <ChevronDown className="w-4 h-4 text-gray-600" aria-hidden="true" />
        </button>

        {/* Actions - min 44px touch targets */}
        <nav aria-label="Quick actions" className="flex items-center gap-1">
          <Link
            href="/compare"
            aria-label="Compare Tanks"
            className={cn(
              "p-3 hover:bg-gray-100 rounded-xl transition-colors",
              "min-h-[44px] min-w-[44px] flex items-center justify-center",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2"
            )}
          >
            <BarChart3 className="w-5 h-5 text-gray-700" aria-hidden="true" />
          </Link>
          <Link
            href="/coaching"
            aria-label="Coaching Tips"
            className={cn(
              "p-3 hover:bg-gray-100 rounded-xl transition-colors",
              "min-h-[44px] min-w-[44px] flex items-center justify-center",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2"
            )}
          >
            <Lightbulb className="w-5 h-5 text-gray-700" aria-hidden="true" />
          </Link>
          <Link
            href="/notifications"
            aria-label={hasNotifications ? "Notifications (new)" : "Notifications"}
            className={cn(
              "relative p-3 hover:bg-gray-100 rounded-xl transition-colors",
              "min-h-[44px] min-w-[44px] flex items-center justify-center",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2"
            )}
          >
            <Bell className="w-5 h-5 text-gray-700" aria-hidden="true" />
            {hasNotifications && (
              <span
                className="absolute top-2 right-2 w-2 h-2 bg-brand-alert rounded-full"
                aria-hidden="true"
              />
            )}
          </Link>
          <Link
            href="/settings"
            aria-label="Settings"
            className={cn(
              "p-3 hover:bg-gray-100 rounded-xl transition-colors",
              "min-h-[44px] min-w-[44px] flex items-center justify-center",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2"
            )}
          >
            <Settings className="w-5 h-5 text-gray-700" aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
