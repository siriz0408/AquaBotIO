"use client";

/**
 * Haptic Feedback Hook
 *
 * Provides standardized vibration patterns for mobile devices.
 * Gracefully degrades on devices that don't support the Vibration API.
 *
 * Usage:
 *   const { trigger } = useHapticFeedback();
 *   trigger('tap');     // Light tap for buttons
 *   trigger('success'); // Double pulse for success
 *   trigger('error');   // Warning pattern for errors
 */

// Vibration patterns in milliseconds
// Each number represents vibration duration, gaps are implicit (0ms between)
const HAPTIC_PATTERNS = {
  tap: [15],              // Light tap for buttons
  success: [50, 30, 50],  // Double pulse for success actions
  error: [100, 50, 100],  // Warning pattern for errors/destructive
  warning: [75],          // Single strong pulse for warnings
  selection: [10],        // Micro tap for selections/toggles
} as const;

export type HapticPattern = keyof typeof HAPTIC_PATTERNS;

/**
 * Check if the device supports vibration
 */
function supportsVibration(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

/**
 * Check if user prefers reduced motion
 * Respects accessibility preferences
 */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Trigger a haptic feedback pattern
 * No-op on devices that don't support vibration or prefer reduced motion
 */
function triggerHaptic(pattern: HapticPattern): void {
  // Respect user's reduced motion preference
  if (prefersReducedMotion()) {
    return;
  }

  if (supportsVibration()) {
    try {
      navigator.vibrate(HAPTIC_PATTERNS[pattern]);
    } catch {
      // Silently fail if vibration is blocked or unavailable
    }
  }
}

/**
 * Hook for haptic feedback
 * Returns a trigger function to fire standardized vibration patterns
 */
export function useHapticFeedback() {
  return {
    trigger: triggerHaptic,
    isSupported: supportsVibration(),
  };
}

/**
 * Standalone function for use outside React components
 * (e.g., in the toast function which isn't a hook)
 */
export { triggerHaptic };
