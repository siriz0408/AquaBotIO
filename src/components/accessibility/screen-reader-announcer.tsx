"use client";

import * as React from "react";

/**
 * ScreenReaderAnnouncer - Live region for dynamic content announcements (WCAG 4.1.3)
 *
 * Announces content changes to screen reader users without visual changes.
 * Use for search results, form submissions, loading states, errors, etc.
 */

type Politeness = "polite" | "assertive";

interface AnnounceOptions {
  /** Urgency level: "polite" waits, "assertive" interrupts */
  politeness?: Politeness;
  /** Clear after this many ms (0 = never clear) */
  clearAfterMs?: number;
}

interface AnnouncerContextValue {
  /** Announce a message to screen readers */
  announce: (message: string, options?: AnnounceOptions) => void;
}

const AnnouncerContext = React.createContext<AnnouncerContextValue | null>(null);

/**
 * Hook to announce messages to screen readers
 */
export function useAnnounce() {
  const context = React.useContext(AnnouncerContext);
  if (!context) {
    throw new Error("useAnnounce must be used within a ScreenReaderAnnouncerProvider");
  }
  return context;
}

interface ScreenReaderAnnouncerProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that renders the live region
 * Add this at the top of your app layout
 */
export function ScreenReaderAnnouncerProvider({ children }: ScreenReaderAnnouncerProviderProps) {
  const [politeMessage, setPoliteMessage] = React.useState("");
  const [assertiveMessage, setAssertiveMessage] = React.useState("");
  const clearTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const announce = React.useCallback((message: string, options?: AnnounceOptions) => {
    const { politeness = "polite", clearAfterMs = 5000 } = options || {};

    // Clear existing timeout
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
    }

    // Force re-announcement by clearing first
    if (politeness === "assertive") {
      setAssertiveMessage("");
      setTimeout(() => setAssertiveMessage(message), 50);
    } else {
      setPoliteMessage("");
      setTimeout(() => setPoliteMessage(message), 50);
    }

    // Auto-clear after delay
    if (clearAfterMs > 0) {
      clearTimeoutRef.current = setTimeout(() => {
        setPoliteMessage("");
        setAssertiveMessage("");
      }, clearAfterMs);
    }
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      {/* Polite live region - waits for current speech */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      {/* Assertive live region - interrupts current speech */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </AnnouncerContext.Provider>
  );
}
