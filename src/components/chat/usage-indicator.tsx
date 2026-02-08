"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UsageData {
  message_count: number;
  daily_limit: number;
  tier: string;
  remaining: number;
  percentage_used: number;
}

interface UsageIndicatorProps {
  className?: string;
}

export function UsageIndicator({ className }: UsageIndicatorProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch("/api/usage?feature=chat");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsage(data.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch usage:", err);
      setError("Unable to load usage");
    }
  };

  // Refresh usage after sending a message
  useEffect(() => {
    const handleMessageSent = () => {
      // Small delay to ensure the API has updated
      setTimeout(fetchUsage, 500);
    };

    window.addEventListener("chat-message-sent", handleMessageSent);
    return () => window.removeEventListener("chat-message-sent", handleMessageSent);
  }, []);

  if (error || !usage) {
    return null;
  }

  const isNearLimit = usage.percentage_used >= 80;
  const isAtLimit = usage.remaining <= 0;
  const isUnlimited = usage.daily_limit >= 999999;

  if (isUnlimited) {
    return (
      <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
        <Sparkles className="w-3 h-3" />
        <span>Unlimited messages</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-1.5 text-xs">
        <MessageCircle className={cn(
          "w-3 h-3",
          isAtLimit ? "text-destructive" : isNearLimit ? "text-yellow-500" : "text-muted-foreground"
        )} />
        <span className={cn(
          isAtLimit ? "text-destructive" : isNearLimit ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground"
        )}>
          {usage.remaining} / {usage.daily_limit} messages left
        </span>
      </div>

      {(isNearLimit || isAtLimit) && usage.tier !== "pro" && (
        <Button asChild variant="ghost" size="sm" className="h-6 px-2 text-xs">
          <Link href="/billing">
            Upgrade
          </Link>
        </Button>
      )}
    </div>
  );
}
