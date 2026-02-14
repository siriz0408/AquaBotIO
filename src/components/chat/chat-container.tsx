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
import type { ActionPayload } from "./action-confirmation";
import type { PhotoDiagnosisData } from "./messages/photo-diagnosis-card";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  // Photo diagnosis support
  type?: "text" | "photo" | "diagnosis";
  photoUrl?: string;
  diagnosisData?: PhotoDiagnosisData;
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPendingAction, setIsPendingAction] = useState(false);
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
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (tankId) params.set("tank_id", tankId);
      const response = await fetch(`/api/ai/chat?${params.toString()}`);
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

  // Send a message with streaming
  const handleSend = async (content: string) => {

    // Add optimistic user message
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);

    // Create a placeholder assistant message for streaming
    const streamingMsgId = `streaming-${Date.now()}`;
    const streamingMessage: Message = {
      id: streamingMsgId,
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/ai/chat?stream=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(tankId ? { tank_id: tankId } : {}),
          message: content,
        }),
      });

      if (!response.ok) {
        // Try to parse error from non-streaming response
        try {
          const errData = await response.json();
          if (errData.error?.code === "DAILY_LIMIT_REACHED") {
            setError("You've reached your daily message limit. Upgrade for more!");
            toast.error("Daily limit reached", {
              description: "Upgrade your plan for more messages",
              action: {
                label: "Upgrade",
                onClick: () => (window.location.href = "/billing"),
              },
            });
          } else {
            setError(errData.error?.message || "Failed to send message");
            toast.error("Failed to send message", {
              description: errData.error?.message,
            });
          }
        } catch {
          setError("Failed to send message");
          toast.error("Failed to send message");
        }
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        setIsLoading(false);
        setIsStreaming(false);
        return;
      }

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream")) {
        // ── STREAMING response ──
        // Add the empty streaming message placeholder
        setMessages((prev) => [...prev, streamingMessage]);
        setIsLoading(false); // Hide loading dots, show streaming content instead

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No readable stream");
        }

        let accumulatedContent = "";
        let finalId = streamingMsgId;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // Parse SSE events
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);
            try {
              const event = JSON.parse(jsonStr);

              if (event.type === "text_delta") {
                accumulatedContent += event.text;
                // Update the streaming message in place
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamingMsgId
                      ? { ...m, content: accumulatedContent }
                      : m
                  )
                );
              } else if (event.type === "done") {
                finalId = event.id;
                // Replace temp ID with real ID
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamingMsgId ? { ...m, id: finalId } : m
                  )
                );
              } else if (event.type === "error") {
                toast.error("AI response interrupted");
              }
            } catch {
              // Skip malformed events
            }
          }
        }

        // Trigger usage refresh
        window.dispatchEvent(new Event("chat-message-sent"));
      } else {
        // ── NON-STREAMING response (fallback) ──
        const data = await response.json();

        if (data.success) {
          const assistantMessage: Message = {
            id: data.data.id,
            role: "assistant",
            content: data.data.content,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          window.dispatchEvent(new Event("chat-message-sent"));
        } else {
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
          setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Network error. Please try again.");
      toast.error("Network error", {
        description: "Please check your connection and try again",
      });
      // Remove optimistic messages
      setMessages((prev) =>
        prev.filter((m) => m.id !== userMessage.id && m.id !== streamingMsgId)
      );
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  // Handle suggested prompt from empty state
  const handleSuggestedPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  // Handle action confirmation
  const handleActionConfirm = useCallback(
    async (action: ActionPayload) => {
      if (!tankId) {
        toast.error("No tank selected");
        return;
      }

      setIsPendingAction(true);
      try {
        const response = await fetch("/api/ai/actions/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: action.type,
            tank_id: tankId,
            payload: action.payload,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Add success message from AI
          const successMessage: Message = {
            id: `action-success-${Date.now()}`,
            role: "assistant",
            content: `Done! ${action.description} completed successfully.`,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, successMessage]);
          toast.success("Action completed", {
            description: action.description,
          });
        } else {
          // Add error message from AI
          const errorMessage: Message = {
            id: `action-error-${Date.now()}`,
            role: "assistant",
            content: `Sorry, I couldn't complete that action. ${data.error?.message || "Please try again."}`,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          toast.error("Action failed", {
            description: data.error?.message || "Please try again",
          });
        }
      } catch (err) {
        console.error("Error executing action:", err);
        const errorMessage: Message = {
          id: `action-error-${Date.now()}`,
          role: "assistant",
          content: "Network error. Please check your connection and try again.",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        toast.error("Network error", {
          description: "Please check your connection",
        });
      } finally {
        setIsPendingAction(false);
      }
    },
    [tankId]
  );

  // Handle action cancel
  const handleActionCancel = useCallback(() => {
    const cancelMessage: Message = {
      id: `action-cancel-${Date.now()}`,
      role: "assistant",
      content: "No problem! I've cancelled that action. Let me know if you need anything else.",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, cancelMessage]);
  }, []);

  // Handle photo send for diagnosis
  const handlePhotoSend = useCallback(
    async (file: File, optionalMessage?: string) => {
      if (!tankId) {
        toast.error("Please select a tank first", {
          description: "Photo diagnosis needs tank context for personalized treatment recommendations",
        });
        return;
      }

      // Create a preview URL for the user's photo message
      const photoPreviewUrl = URL.createObjectURL(file);

      // Add user photo message
      const userPhotoMessage: Message = {
        id: `photo-${Date.now()}`,
        role: "user",
        content: optionalMessage || "Analyze this photo",
        created_at: new Date().toISOString(),
        type: "photo",
        photoUrl: photoPreviewUrl,
      };
      setMessages((prev) => [...prev, userPhotoMessage]);
      setIsLoading(true);
      setError(null);

      try {
        // Build form data for photo diagnosis API
        const formData = new FormData();
        formData.append("image", file);
        formData.append("tank_id", tankId);
        formData.append("diagnosis_type", "both"); // Species ID + Disease

        const response = await fetch("/api/ai/photo-diagnosis", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          // Build diagnosis data for the card
          const diagnosisData: PhotoDiagnosisData = {
            imageUrl: data.data.photoUrl || photoPreviewUrl,
            diagnosisType: data.data.diagnosisType,
            speciesResult: data.data.speciesResult,
            diseaseResult: data.data.diseaseResult,
          };

          // Add AI diagnosis message
          const diagnosisMessage: Message = {
            id: data.data.id || `diagnosis-${Date.now()}`,
            role: "assistant",
            content: "", // Content rendered by PhotoDiagnosisCard
            created_at: new Date().toISOString(),
            type: "diagnosis",
            diagnosisData,
          };
          setMessages((prev) => [...prev, diagnosisMessage]);

          // Refresh usage indicator
          window.dispatchEvent(new Event("chat-message-sent"));

          // Show remaining diagnoses if applicable
          if (data.data.usage?.remaining_today !== undefined) {
            toast.success("Photo analyzed!", {
              description: `${data.data.usage.remaining_today} diagnoses remaining today`,
            });
          }
        } else {
          // Handle errors
          if (data.error?.code === "TIER_REQUIRED") {
            toast.error("Upgrade required", {
              description: "Photo diagnosis requires Plus or Pro plan",
              action: {
                label: "Upgrade",
                onClick: () => (window.location.href = "/settings/billing"),
              },
            });
          } else if (data.error?.code === "DAILY_LIMIT_REACHED") {
            toast.error("Daily limit reached", {
              description: data.error.message,
              action: {
                label: "Upgrade",
                onClick: () => (window.location.href = "/settings/billing"),
              },
            });
          } else {
            toast.error("Analysis failed", {
              description: data.error?.message || "Please try again",
            });
          }
          // Remove the photo message on failure
          setMessages((prev) => prev.filter((m) => m.id !== userPhotoMessage.id));
          // Clean up preview URL
          URL.revokeObjectURL(photoPreviewUrl);
        }
      } catch (err) {
        console.error("Photo diagnosis error:", err);
        toast.error("Network error", {
          description: "Please check your connection and try again",
        });
        // Remove the photo message on failure
        setMessages((prev) => prev.filter((m) => m.id !== userPhotoMessage.id));
        URL.revokeObjectURL(photoPreviewUrl);
      } finally {
        setIsLoading(false);
      }
    },
    [tankId]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <ChatTopBar
        tankId={tankId}
        tankName={tankId ? (activeTank?.name || "Tank") : "General Chat"}
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
            <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
            <span className="text-gray-500 text-sm">Loading chat history...</span>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex-1 overflow-y-auto bg-brand-bg">
          <EmptyState onSuggestedPrompt={handleSuggestedPrompt} hasTank={!!tankId} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-brand-bg">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            tankId={tankId}
            onActionConfirm={handleActionConfirm}
            onActionCancel={handleActionCancel}
            isPendingAction={isPendingAction}
          />
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Streaming indicator */}
      {isStreaming && !isLoading && (
        <div className="px-4 py-1 bg-brand-teal/5 text-brand-teal text-xs text-center flex items-center justify-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-pulse" />
          AquaBot is typing...
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
        onPhotoSend={handlePhotoSend}
        isLoading={isLoading || isStreaming}
        disabled={false}
        showQuickActions={messages.length === 0}
      />
    </div>
  );
}
