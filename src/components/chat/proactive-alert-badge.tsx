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

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center",
        "min-w-[20px] h-5 px-1.5 rounded-full",
        "bg-[#FF6B6B] text-white text-xs font-bold",
        "animate-pulse",
        "transition-transform hover:scale-110 active:scale-95",
        onClick && "cursor-pointer",
        className
      )}
      aria-label={`${count} proactive alert${count !== 1 ? "s" : ""}`}
    >
      {count > 99 ? "99+" : count}
    </button>
  );
}
