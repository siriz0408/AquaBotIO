"use client";

import { cn } from "@/lib/utils";

interface UserMessageProps {
  content: string;
  timestamp: Date;
  className?: string;
}

export function UserMessage({ content, timestamp, className }: UserMessageProps) {
  return (
    <div className={cn("flex justify-end", className)}>
      <div className="max-w-[75%]">
        <div className="bg-gradient-to-br from-brand-teal to-brand-navy text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
        <p className="text-xs text-gray-500 mt-1 text-right">
          {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
