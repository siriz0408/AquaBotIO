"use client";

import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatTopBarProps {
  tankName?: string;
  tankType?: string;
  tankVolume?: number;
  onTankSelect?: () => void;
  className?: string;
}

export function ChatTopBar({
  tankName = "Select Tank",
  tankType,
  tankVolume,
  onTankSelect,
  className,
}: ChatTopBarProps) {
  const subtitle = tankType && tankVolume
    ? `${tankType.charAt(0).toUpperCase() + tankType.slice(1).replace(/_/g, " ")} • ${tankVolume} gal`
    : undefined;

  return (
    <div className={cn("bg-white shadow-sm border-b border-gray-200", className)}>
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>

          <div>
            <h1 className="font-semibold text-brand-navy">{tankName}</h1>
            {subtitle && (
              <span className="text-xs text-gray-500">{subtitle}</span>
            )}
          </div>
        </div>

        {onTankSelect && (
          <button
            onClick={onTankSelect}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronDown className="w-5 h-5 text-gray-700" />
          </button>
        )}
      </div>
    </div>
  );
}
