"use client";

import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface AITextMessageProps {
  content: string;
  timestamp: Date;
  className?: string;
}

export function AITextMessage({ content, timestamp, className }: AITextMessageProps) {
  return (
    <div className={cn("flex justify-start", className)}>
      <div className="max-w-[85%]">
        <div className="flex items-start gap-2 mb-1">
          <div className="w-6 h-6 bg-gradient-to-br from-brand-teal to-brand-navy rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-semibold text-brand-teal">AquaBot</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm ml-8">
          <div className="text-sm leading-relaxed text-gray-800 prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                code: ({ children }) => (
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1 ml-8">
          {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
