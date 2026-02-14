"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import type { ActionPayload } from "./action-confirmation";
import type { Message } from "./chat-container";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  tankId?: string;
  onActionConfirm?: (action: ActionPayload) => Promise<void>;
  onActionCancel?: () => void;
  isPendingAction?: boolean;
}

export function MessageList({
  messages,
  isLoading,
  tankId,
  onActionConfirm,
  onActionCancel,
  isPendingAction,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <span className="text-3xl">🐠</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Welcome to AquaBot
          </h3>
          <p className="text-muted-foreground text-sm">
            I&apos;m your AI aquarium assistant. Ask me anything about your tank,
            water parameters, livestock compatibility, or maintenance schedules!
          </p>
          <div className="mt-6 space-y-2">
            <p className="text-xs text-muted-foreground">Try asking:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <SuggestionChip text="What fish can I add?" />
              <SuggestionChip text="Are my parameters okay?" />
              <SuggestionChip text="Schedule a water change" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          role={message.role}
          content={message.content}
          timestamp={message.created_at}
          tankId={tankId}
          onActionConfirm={onActionConfirm}
          onActionCancel={onActionCancel}
          isPendingAction={isPendingAction}
          type={message.type}
          photoUrl={message.photoUrl}
          diagnosisData={message.diagnosisData}
        />
      ))}
      {isLoading && (
        <MessageBubble
          role="assistant"
          content=""
          isLoading
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function SuggestionChip({ text }: { text: string }) {
  return (
    <button
      className="px-3 py-1.5 text-xs bg-muted rounded-full hover:bg-muted/80 transition-colors"
      onClick={() => {
        // This will be handled by the parent component
        const event = new CustomEvent("suggestion-click", { detail: text });
        window.dispatchEvent(event);
      }}
    >
      {text}
    </button>
  );
}
