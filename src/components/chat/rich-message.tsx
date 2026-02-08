"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SpeciesCard } from "./messages/species-card";
import { ParameterAlertCard } from "./messages/parameter-alert-card";
import { ActionButtons } from "./action-buttons";

interface RichMessageProps {
  content: string;
  isUser?: boolean;
}

// Parse content into segments: markdown text vs structured blocks
interface TextSegment {
  type: "text";
  content: string;
}
interface SpeciesCardSegment {
  type: "species-card";
  data: {
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
  };
}
interface ParameterAlertSegment {
  type: "parameter-alert";
  data: {
    parameter: string;
    currentValue: string;
    unit: string;
    status: "good" | "warning" | "alert";
    trend: number[];
    recommendation: string;
  };
}
interface ActionButtonsSegment {
  type: "action-buttons";
  data: { label: string; action: string }[];
}

type Segment =
  | TextSegment
  | SpeciesCardSegment
  | ParameterAlertSegment
  | ActionButtonsSegment;

const BLOCK_TYPES = ["species-card", "parameter-alert", "action-buttons"];

function parseContent(content: string): Segment[] {
  const segments: Segment[] = [];
  // Match fenced code blocks with our custom language tags
  const pattern = /```(species-card|parameter-alert|action-buttons)\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match = pattern.exec(content);

  while (match !== null) {
    // Add text before this block
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim();
      if (text) {
        segments.push({ type: "text", content: text });
      }
    }

    const blockType = match[1];
    const blockContent = match[2].trim();

    try {
      const parsed = JSON.parse(blockContent);

      if (blockType === "species-card" && BLOCK_TYPES.includes(blockType)) {
        segments.push({ type: "species-card", data: parsed });
      } else if (blockType === "parameter-alert") {
        segments.push({ type: "parameter-alert", data: parsed });
      } else if (blockType === "action-buttons") {
        segments.push({ type: "action-buttons", data: parsed });
      }
    } catch {
      // If JSON parsing fails, render as regular text
      segments.push({
        type: "text",
        content: blockContent,
      });
    }

    lastIndex = match.index + match[0].length;
    match = pattern.exec(content);
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim();
    if (text) {
      segments.push({ type: "text", content: text });
    }
  }

  // If no segments were found, return the whole content as text
  if (segments.length === 0) {
    segments.push({ type: "text", content });
  }

  return segments;
}

export function RichMessage({ content, isUser }: RichMessageProps) {
  const segments = useMemo(() => parseContent(content), [content]);

  if (isUser) {
    // User messages are always plain markdown
    return (
      <div className="chat-prose chat-prose-user">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {segments.map((segment, index) => {
        switch (segment.type) {
          case "text":
            return (
              <div key={index} className="chat-prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {segment.content}
                </ReactMarkdown>
              </div>
            );

          case "species-card":
            return (
              <div key={index} className="-mx-4">
                <SpeciesCard
                  data={segment.data}
                  timestamp={new Date()}
                />
              </div>
            );

          case "parameter-alert":
            return (
              <div key={index} className="-mx-4">
                <ParameterAlertCard
                  data={segment.data}
                  timestamp={new Date()}
                />
              </div>
            );

          case "action-buttons":
            return <ActionButtons key={index} actions={segment.data} />;

          default:
            return null;
        }
      })}
    </div>
  );
}
