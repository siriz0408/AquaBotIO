"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Bot, User, Camera } from "lucide-react";
import { RichMessage } from "./rich-message";
import type { ActionPayload } from "./action-confirmation";
import { PhotoDiagnosisCard, type PhotoDiagnosisData } from "./messages/photo-diagnosis-card";

interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  isLoading?: boolean;
  tankId?: string;
  onActionConfirm?: (action: ActionPayload) => Promise<void>;
  onActionCancel?: () => void;
  isPendingAction?: boolean;
  // Photo diagnosis support
  type?: "text" | "photo" | "diagnosis";
  photoUrl?: string;
  diagnosisData?: PhotoDiagnosisData;
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
  type = "text",
  photoUrl,
  diagnosisData,
}: MessageBubbleProps) {
  const isUser = role === "user";

  // Render photo diagnosis card (full-width, no bubble wrapper)
  if (type === "diagnosis" && diagnosisData) {
    return (
      <PhotoDiagnosisCard
        data={diagnosisData}
        timestamp={timestamp ? new Date(timestamp) : new Date()}
        className="mb-4"
      />
    );
  }

  // Render user photo message
  if (type === "photo" && photoUrl) {
    return (
      <div className="flex gap-3 mb-4 flex-row-reverse">
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
          <User className="w-4 h-4" />
        </div>

        {/* Photo message */}
        <div className="max-w-[85%] rounded-2xl overflow-hidden bg-primary text-primary-foreground rounded-tr-sm">
          {/* Photo */}
          <div className="relative w-64 h-48">
            <Image
              src={photoUrl}
              alt="Photo for analysis"
              fill
              className="object-cover"
              sizes="256px"
            />
            <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
              <Camera className="w-3 h-3 text-white" />
              <span className="text-xs text-white font-medium">Analyzing...</span>
            </div>
          </div>
          {/* Caption */}
          {content && (
            <div className="px-4 py-2 text-sm">
              {content}
            </div>
          )}
          {timestamp && (
            <div className="text-xs px-4 pb-2 opacity-60 text-right">
              {formatTime(timestamp)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular text message
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
