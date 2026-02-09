"use client";

import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { RichMessage } from "./rich-message";
import type { ActionPayload } from "./action-confirmation";

interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  isLoading?: boolean;
  tankId?: string;
  onActionConfirm?: (action: ActionPayload) => Promise<void>;
  onActionCancel?: () => void;
  isPendingAction?: boolean;
}

export function MessageBubble({
  role,
  content,
  timestamp,
  isLoading,
  tankId,
  onActionConfirm,
  onActionCancel,
  isPendingAction,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 mb-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-gradient-to-br from-brand-teal to-brand-navy text-white"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-white shadow-sm border border-gray-100 rounded-tl-sm"
        )}
      >
        {isLoading ? (
          <LoadingDots />
        ) : (
          <RichMessage
            content={content}
            isUser={isUser}
            tankId={tankId}
            onActionConfirm={onActionConfirm}
            onActionCancel={onActionCancel}
            isPendingAction={isPendingAction}
          />
        )}

        {timestamp && (
          <div
            className={cn(
              "text-xs mt-2 opacity-60",
              isUser ? "text-right" : "text-left"
            )}
          >
            {formatTime(timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex gap-1.5 py-2 px-1">
      <div className="w-2 h-2 rounded-full bg-brand-teal animate-bounce" style={{ animationDelay: "0ms" }} />
      <div className="w-2 h-2 rounded-full bg-brand-teal animate-bounce" style={{ animationDelay: "150ms" }} />
      <div className="w-2 h-2 rounded-full bg-brand-teal animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
