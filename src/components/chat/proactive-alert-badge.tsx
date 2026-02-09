"use client";

import { cn } from "@/lib/utils";

export interface ProactiveAlertBadgeProps {
  count: number;
  onClick?: () => void;
  className?: string;
}

export function ProactiveAlertBadge({
  count,
  onClick,
  className,
}: ProactiveAlertBadgeProps) {
  // Hide when count is 0
  if (count <= 0) {
    return null;
  }

  const displayCount = count > 99 ? "99+" : count;
  const alertLabel = `${count} proactive alert${count !== 1 ? "s" : ""}. Click to view.`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center",
        "min-w-[24px] h-6 px-1.5 rounded-full", // WCAG 2.5.8 min target 24px
        "bg-[#FF6B6B] text-white text-xs font-bold",
        // Animation respects prefers-reduced-motion via CSS
        "motion-safe:animate-pulse",
        "transition-transform hover:scale-110 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#FF6B6B]",
        onClick && "cursor-pointer",
        className
      )}
      aria-label={alertLabel}
      aria-live="polite"
    >
      {displayCount}
    </button>
  );
}
