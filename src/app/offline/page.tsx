"use client";

import { Fish, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <div className="flex items-center gap-2">
        <Fish className="h-12 w-12 text-brand-cyan" />
        <span className="text-2xl font-bold">AquaBotAI</span>
      </div>

      <div className="flex flex-col items-center gap-4">
        <WifiOff className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">You&apos;re Offline</h1>
        <p className="max-w-md text-muted-foreground">
          It looks like you&apos;ve lost your internet connection. Some features may be limited
          until you&apos;re back online.
        </p>
      </div>

      <Button
        onClick={() => window.location.reload()}
        variant="outline"
      >
        Try Again
      </Button>

      <p className="text-sm text-muted-foreground">
        Your unsaved changes will sync when you reconnect.
      </p>
    </div>
  );
}
