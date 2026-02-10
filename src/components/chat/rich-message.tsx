"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SpeciesCard } from "./messages/species-card";
import { ParameterAlertCard } from "./messages/parameter-alert-card";
import {
  PhotoDiagnosisCard,
  type PhotoDiagnosisData,
} from "./messages/photo-diagnosis-card";
import { ActionButtons } from "./action-buttons";
import { ActionConfirmation, type ActionPayload } from "./action-confirmation";
import { ProactiveAlertCard, type ProactiveAlert } from "./proactive-alert-card";
import {
  WaterChangeCalculatorWidget,
  type WaterChangeCalculatorData,
  QuarantineChecklistWidget,
  type QuarantineChecklistData,
  ParameterTroubleshootingWidget,
  type ParameterTroubleshootingData,
} from "./widgets";
import { toast } from "sonner";

interface RichMessageProps {
  content: string;
  isUser?: boolean;
  tankId?: string;
  onActionConfirm?: (action: ActionPayload) => Promise<void>;
  onActionCancel?: () => void;
  isPendingAction?: boolean;
  onAlertDismiss?: (alertId: string) => void;
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
interface PhotoDiagnosisSegment {
  type: "photo-diagnosis";
  data: PhotoDiagnosisData;
}
interface ActionButtonsSegment {
  type: "action-buttons";
  data: { label: string; action: string }[];
}
interface ActionConfirmationSegment {
  type: "action-confirmation";
  data: ActionPayload;
}
interface ProactiveAlertSegment {
  type: "proactive-alert";
  data: ProactiveAlert;
}
interface WaterChangeCalculatorSegment {
  type: "water-change-calculator";
  data: WaterChangeCalculatorData;
}
interface QuarantineChecklistSegment {
  type: "quarantine-checklist";
  data: QuarantineChecklistData;
}
interface ParameterTroubleshootingSegment {
  type: "parameter-troubleshooting";
  data: ParameterTroubleshootingData;
}

type Segment =
  | TextSegment
  | SpeciesCardSegment
  | ParameterAlertSegment
  | PhotoDiagnosisSegment
  | ActionButtonsSegment
  | ActionConfirmationSegment
  | ProactiveAlertSegment
  | WaterChangeCalculatorSegment
  | QuarantineChecklistSegment
  | ParameterTroubleshootingSegment;

const BLOCK_TYPES = [
  "species-card",
  "parameter-alert",
  "photo-diagnosis",
  "action-buttons",
  "action-confirmation",
  "proactive-alert",
  "water-change-calculator",
  "quarantine-checklist",
  "parameter-troubleshooting",
];

function parseContent(content: string): Segment[] {
  const segments: Segment[] = [];

  // Strip incomplete structured code blocks at end of content (prevents code flash during streaming)
  // This catches partial blocks like ```action-confirmation\n{"type":"sche... that haven't closed yet
  const incompleteBlockPattern = /```(species-card|parameter-alert|photo-diagnosis|action-buttons|action-confirmation|proactive-alert|water-change-calculator|quarantine-checklist|parameter-troubleshooting)[\s\S]*$/;
  const lastTripleBacktickIndex = content.lastIndexOf("```");
  if (lastTripleBacktickIndex >= 0) {
    const afterLast = content.slice(lastTripleBacktickIndex);
    // If the last ``` is an opening block (has a type tag) with no matching close, strip it
    if (incompleteBlockPattern.test(afterLast) && (afterLast.match(/```/g) || []).length === 1) {
      content = content.slice(0, lastTripleBacktickIndex).trimEnd();
    }
  }

  // Match fenced code blocks with our custom language tags
  const pattern = /```(species-card|parameter-alert|photo-diagnosis|action-buttons|action-confirmation|proactive-alert|water-change-calculator|quarantine-checklist|parameter-troubleshooting)\n([\s\S]*?)```/g;

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
      } else if (blockType === "photo-diagnosis") {
        segments.push({ type: "photo-diagnosis", data: parsed });
      } else if (blockType === "action-buttons") {
        segments.push({ type: "action-buttons", data: parsed });
      } else if (blockType === "action-confirmation") {
        segments.push({ type: "action-confirmation", data: parsed });
      } else if (blockType === "proactive-alert") {
        segments.push({ type: "proactive-alert", data: parsed });
      } else if (blockType === "water-change-calculator") {
        segments.push({ type: "water-change-calculator", data: parsed });
      } else if (blockType === "quarantine-checklist") {
        segments.push({ type: "quarantine-checklist", data: parsed });
      } else if (blockType === "parameter-troubleshooting") {
        segments.push({ type: "parameter-troubleshooting", data: parsed });
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

export function RichMessage({
  content,
  isUser,
  tankId = "",
  onActionConfirm,
  onActionCancel,
  isPendingAction,
  onAlertDismiss,
}: RichMessageProps) {
  const segments = useMemo(() => parseContent(content), [content]);

  // Handle alert dismissal
  const handleAlertDismiss = async (alertId: string) => {
    try {
      const response = await fetch("/api/ai/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "dismiss",
          alert_id: alertId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Alert dismissed");
        // Trigger refresh of alert counts
        window.dispatchEvent(new Event("alerts-updated"));
        if (onAlertDismiss) {
          onAlertDismiss(alertId);
        }
      } else {
        toast.error(data.error?.message || "Failed to dismiss alert");
      }
    } catch (error) {
      console.error("Error dismissing alert:", error);
      toast.error("Failed to dismiss alert");
    }
  };

  // Handle taking action on alert suggestion
  const handleAlertAction = (action: string) => {
    // For now, just show a toast with the suggestion
    // In future, this could trigger the actual action flow
    toast.info(action, {
      description: "Follow this suggestion to address the alert",
      duration: 5000,
    });
  };

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

          case "photo-diagnosis":
            return (
              <div key={index} className="-mx-4">
                <PhotoDiagnosisCard
                  data={segment.data}
                  timestamp={new Date()}
                />
              </div>
            );

          case "action-buttons":
            return <ActionButtons key={index} actions={segment.data} />;

          case "action-confirmation":
            return (
              <div key={index} className="-mx-4 px-4">
                <ActionConfirmation
                  action={segment.data}
                  tankId={tankId}
                  onConfirm={
                    onActionConfirm
                      ? () => onActionConfirm(segment.data)
                      : async () => {}
                  }
                  onCancel={onActionCancel || (() => {})}
                  isPending={isPendingAction}
                />
              </div>
            );

          case "proactive-alert":
            return (
              <div key={index} className="-mx-4">
                <ProactiveAlertCard
                  alert={segment.data}
                  onDismiss={handleAlertDismiss}
                  onTakeAction={handleAlertAction}
                />
              </div>
            );

          case "water-change-calculator":
            return (
              <div key={index} className="-mx-4 px-4">
                <WaterChangeCalculatorWidget data={segment.data} />
              </div>
            );

          case "quarantine-checklist":
            return (
              <div key={index} className="-mx-4 px-4">
                <QuarantineChecklistWidget data={segment.data} />
              </div>
            );

          case "parameter-troubleshooting":
            return (
              <div key={index} className="-mx-4 px-4">
                <ParameterTroubleshootingWidget data={segment.data} />
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
