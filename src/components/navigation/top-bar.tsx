"use client";

import Link from "next/link";
import { ChevronDown, Bell, Settings } from "lucide-react";
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
    <div className={cn("bg-white shadow-sm sticky top-0 z-30", className)}>
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Tank Selector */}
        <button
          onClick={onTankSelect}
          className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors"
        >
          <span className="font-semibold text-brand-navy">{tankName}</span>
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-700" />
            {hasNotifications && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-alert rounded-full" />
            )}
          </Link>
          <Link
            href="/settings"
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-700" />
          </Link>
        </div>
      </div>
    </div>
  );
}
