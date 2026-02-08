"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { UsageIndicator } from "./usage-indicator";
import { ChatTopBar } from "./chat-top-bar";
import { EmptyState } from "./empty-state";
import { useTank } from "@/context/tank-context";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

interface ChatContainerProps {
  tankId?: string;
  showTankSwitcher?: boolean;
}

export function ChatContainer({
  tankId: propTankId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showTankSwitcher = true,
}: ChatContainerProps) {
  const { activeTank } = useTank();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use prop tankId or active tank from context
  const tankId = propTankId || activeTank?.id;

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history
  const loadHistory = useCallback(async () => {
    if (!tankId) {
      setIsInitialLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/ai/chat?tank_id=${tankId}&limit=50`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.data.messages || []);
      } else {
        console.error("Failed to load chat history:", data.error);
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    } finally {
      setIsInitialLoading(false);
    }
  }, [tankId]);

  // Load history when tank changes
  useEffect(() => {
    setMessages([]);
    setIsInitialLoading(true);
    loadHistory();
  }, [loadHistory]);

  // Send a message
  const handleSend = async (content: string) => {
    if (!tankId) {
      toast.error("Please select a tank first");
      return;
    }

    // Add optimistic user message
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tank_id: tankId,
          message: content,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add assistant message
        const assistantMessage: Message = {
          id: data.data.id,
          role: "assistant",
          content: data.data.content,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Trigger usage refresh
        window.dispatchEvent(new Event("chat-message-sent"));
      } else {
        // Handle specific error codes
        if (data.error?.code === "DAILY_LIMIT_REACHED") {
          setError("You've reached your daily message limit. Upgrade for more!");
          toast.error("Daily limit reached", {
            description: "Upgrade your plan for more messages",
            action: {
              label: "Upgrade",
              onClick: () => (window.location.href = "/billing"),
            },
          });
        } else {
          setError(data.error?.message || "Failed to send message");
          toast.error("Failed to send message", {
            description: data.error?.message,
          });
        }

        // Remove the optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Network error. Please try again.");
      toast.error("Network error", {
        description: "Please check your connection and try again",
      });

      // Remove the optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggested prompt from empty state
  const handleSuggestedPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  // No tank selected
  if (!tankId) {
    return (
      <div className="flex flex-col h-full">
        <ChatTopBar tankName="Select Tank" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-brand-bg">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-brand-teal/20 to-brand-navy/20 flex items-center justify-center">
              <span className="text-3xl">🐟</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-brand-navy">Select a Tank</h3>
            <p className="text-gray-600 text-sm">
              Choose a tank to start chatting with AquaBot about your aquarium.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <ChatTopBar
        tankName={activeTank?.name || "Tank"}
        tankType={activeTank?.type}
        tankVolume={activeTank?.volume_gallons}
      />

      {/* Usage Indicator */}
      <div className="bg-white border-b px-4 py-2">
        <UsageIndicator />
      </div>

      {/* Messages or Empty State */}
      {isInitialLoading ? (
        <div className="flex-1 flex items-center justify-center bg-brand-bg">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-brand-cyan" />
            <span className="text-gray-500 text-sm">Loading chat history...</span>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex-1 overflow-y-auto bg-brand-bg">
          <EmptyState onSuggestedPrompt={handleSuggestedPrompt} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-brand-bg">
          <MessageList messages={messages} isLoading={isLoading} />
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-brand-alert/10 text-brand-alert text-sm text-center">
          {error}
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        isLoading={isLoading}
        disabled={!tankId}
        showQuickActions={messages.length === 0}
      />
    </div>
  );
}
