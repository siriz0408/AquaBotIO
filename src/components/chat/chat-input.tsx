"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
    if (onQuickAction) {
      onQuickAction(action.label);
    } else {
      setMessage(action.label);
      textareaRef.current?.focus();
    }
    setShowQuickActions(false);
  };

  return (
    <div className="bg-white border-t border-gray-200 shadow-lg">
      {/* Quick Actions */}
      {showQuickActions && (
        <div className="px-4 pt-3 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                disabled={isLoading || disabled}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors whitespace-nowrap flex-shrink-0 disabled:opacity-50"
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-3 flex items-end gap-2">
        {/* Photo Upload Button */}
        <button
          disabled={isLoading || disabled}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0 mb-1 disabled:opacity-50"
        >
          <Camera className="w-5 h-5 text-gray-600" />
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading || disabled}
            rows={1}
            className={cn(
              "w-full px-4 py-3 border-2 border-gray-200 rounded-2xl",
              "focus:outline-none focus:border-brand-teal transition-colors",
              "resize-none min-h-[44px] max-h-32",
              "text-sm placeholder:text-gray-400",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading || disabled}
          className={cn(
            "p-3 rounded-xl flex-shrink-0 transition-all mb-1",
            message.trim() && !isLoading && !disabled
              ? "bg-gradient-to-br from-brand-teal to-brand-navy text-white shadow-lg hover:shadow-xl"
              : "bg-gray-200 text-gray-400"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
