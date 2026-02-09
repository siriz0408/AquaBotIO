"use client";

import { useState, useRef, useEffect, KeyboardEvent, useId } from "react";
import { Send, Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";

interface QuickAction {
  id: string;
  label: string;
  icon: string;
}

const quickActions: QuickAction[] = [
  { id: "1", label: "Log parameters", icon: "📊" },
  { id: "2", label: "Check compatibility", icon: "🐠" },
  { id: "3", label: "Show schedule", icon: "📅" },
];

interface ChatInputProps {
  onSend: (message: string) => void;
  onQuickAction?: (action: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  showQuickActions?: boolean;
}

export function ChatInput({
  onSend,
  onQuickAction,
  isLoading,
  disabled,
  placeholder = "Ask AquaBot anything...",
  showQuickActions: initialShowQuickActions = true,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(initialShowQuickActions);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { trigger: triggerHaptic } = useHapticFeedback();
  const inputId = useId();
  const hintId = useId();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    }
  }, [message]);

  // Listen for suggestion clicks
  useEffect(() => {
    const handleSuggestion = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setMessage(customEvent.detail);
      setShowQuickActions(false);
      textareaRef.current?.focus();
    };

    window.addEventListener("suggestion-click", handleSuggestion);
    return () => window.removeEventListener("suggestion-click", handleSuggestion);
  }, []);

  const handleSubmit = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading || disabled) return;

    triggerHaptic("tap");
    onSend(trimmedMessage);
    setMessage("");
    setShowQuickActions(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    triggerHaptic("selection");
    if (onQuickAction) {
      onQuickAction(action.label);
    } else {
      setMessage(action.label);
      textareaRef.current?.focus();
    }
    setShowQuickActions(false);
  };

  const isSubmitDisabled = !message.trim() || isLoading || disabled;

  return (
    <div className="bg-white border-t border-gray-200 shadow-lg">
      {/* Quick Actions */}
      {showQuickActions && (
        <div className="px-4 pt-3 pb-2" role="group" aria-label="Quick actions">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                disabled={isLoading || disabled}
                aria-disabled={isLoading || disabled}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 min-h-[44px] bg-gray-100 rounded-full",
                  "text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors",
                  "whitespace-nowrap flex-shrink-0",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <span aria-hidden="true">{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-3 flex items-end gap-2">
        {/* Photo Upload Button - min 44px touch target */}
        <button
          type="button"
          disabled={isLoading || disabled}
          aria-disabled={isLoading || disabled}
          aria-label="Upload photo for diagnosis"
          className={cn(
            "p-3 min-h-[44px] min-w-[44px] flex items-center justify-center",
            "hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0 mb-1",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Camera className="w-5 h-5 text-gray-600" aria-hidden="true" />
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <label htmlFor={inputId} className="sr-only">
            Message to AquaBot
          </label>
          <textarea
            id={inputId}
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading || disabled}
            aria-disabled={isLoading || disabled}
            aria-describedby={hintId}
            rows={1}
            className={cn(
              "w-full px-4 py-3 border-2 border-gray-200 rounded-2xl",
              "focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 transition-colors",
              "resize-none min-h-[44px] max-h-32",
              "text-sm placeholder:text-gray-400",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
          <span id={hintId} className="sr-only">
            Press Enter to send, Shift+Enter for new line
          </span>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          aria-disabled={isSubmitDisabled}
          aria-label={isLoading ? "Sending message" : "Send message"}
          className={cn(
            "p-3 min-h-[44px] min-w-[44px] rounded-xl flex-shrink-0 transition-all mb-1",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2",
            !isSubmitDisabled
              ? "bg-gradient-to-br from-brand-teal to-brand-navy text-white shadow-lg hover:shadow-xl"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              <span className="sr-only">Sending</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" aria-hidden="true" />
              <span className="sr-only">Send</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
