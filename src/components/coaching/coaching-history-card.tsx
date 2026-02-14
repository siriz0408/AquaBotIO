"use client";

import { Lightbulb, Fish } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoachingHistoryCardProps {
  message: string;
  createdAt: string;
  tankName?: string | null;
  className?: string;
}

/**
 * Format a date for display in the coaching history.
 * Shows relative time for recent dates, otherwise formatted date.
 */
function formatCoachingDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Same day
  if (diffDays === 0) {
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return "Just now";
      return `${diffMins} min ago`;
    }
    // Format as "Today at 9:00 AM"
    return `Today at ${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  }

  // Yesterday
  if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  }

  // Within last week
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Older - show full date
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Card component for displaying a coaching history entry.
 * Shows date, message, and optionally the tank it was about.
 */
export function CoachingHistoryCard({
  message,
  createdAt,
  tankName,
  className,
}: CoachingHistoryCardProps) {
  const formattedDate = formatCoachingDate(createdAt);

  return (
    <article
      className={cn(
        "bg-white rounded-2xl p-4 shadow-sm border-l-4 border-brand-teal",
        "transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "rgba(27, 153, 139, 0.15)" }}
        >
          <Lightbulb className="w-5 h-5 text-brand-teal" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header with date and tank badge */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <time
              dateTime={createdAt}
              className="text-xs font-medium text-gray-500"
            >
              {formattedDate}
            </time>

            {tankName && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                  bg-brand-navy/10 text-brand-navy"
              >
                <Fish className="w-3 h-3" aria-hidden="true" />
                {tankName}
              </span>
            )}
          </div>

          {/* Message */}
          <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
        </div>
      </div>
    </article>
  );
}

export default CoachingHistoryCard;
