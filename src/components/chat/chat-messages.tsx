"use client";

import { motion } from "framer-motion";
import { UserMessage, AITextMessage, SpeciesCard, ParameterAlertCard } from "./messages";
import { cn } from "@/lib/utils";

export type MessageContentType =
  | "text"
  | "species-card"
  | "parameter-alert"
  | "action-confirmation";

interface SpeciesCardData {
  name: string;
  scientificName: string;
  imageUrl?: string;
  stats: {
    minTankSize: string;
    temperament: string;
    careLevel: string;
    temperature: string;
    pH: string;
    maxSize: string;
  };
  compatibility: "good" | "warning" | "alert";
  compatibilityMessage: string;
}

interface ParameterAlertData {
  parameter: string;
  currentValue: string;
  unit: string;
  status: "good" | "warning" | "alert";
  trend: number[];
  recommendation: string;
}

export interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string | SpeciesCardData | ParameterAlertData;
  contentType?: MessageContentType;
  timestamp: Date;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  className?: string;
}

export function ChatMessages({ messages, className }: ChatMessagesProps) {
  return (
    <div className={cn("p-4 space-y-4 max-w-3xl mx-auto", className)}>
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          {message.type === "user" ? (
            <UserMessage
              content={message.content as string}
              timestamp={message.timestamp}
            />
          ) : (
            <>
              {(!message.contentType || message.contentType === "text") && (
                <AITextMessage
                  content={message.content as string}
                  timestamp={message.timestamp}
                />
              )}
              {message.contentType === "species-card" && (
                <SpeciesCard
                  data={message.content as SpeciesCardData}
                  timestamp={message.timestamp}
                />
              )}
              {message.contentType === "parameter-alert" && (
                <ParameterAlertCard
                  data={message.content as ParameterAlertData}
                  timestamp={message.timestamp}
                />
              )}
            </>
          )}
        </motion.div>
      ))}
    </div>
  );
}
