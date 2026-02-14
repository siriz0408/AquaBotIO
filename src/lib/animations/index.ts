"use client";

import { useEffect, useState } from "react";
import type { Variants, Transition } from "framer-motion";

/**
 * Animation utilities for AquaBotAI
 * All animations respect prefers-reduced-motion
 */

// ============================================
// Accessibility Hook
// ============================================

/**
 * Hook to detect if user prefers reduced motion
 * Returns true if reduced motion is preferred
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

// ============================================
// Spring Configurations
// ============================================

/** Snappy spring for tap feedback */
export const springTap: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 17,
};

/** Bouncy spring for playful interactions */
export const springBounce: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 20,
};

/** Gentle spring for smooth transitions */
export const springGentle: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 25,
};

/** Quick transition for fast feedback */
export const transitionFast: Transition = {
  duration: 0.15,
  ease: "easeOut",
};

/** Standard transition duration */
export const transitionDefault: Transition = {
  duration: 0.2,
  ease: "easeInOut",
};

// ============================================
// Animation Variants
// ============================================

/** Fade in animation */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

/** Fade in with slide up */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

/** Fade in with slide down */
export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0 },
};

/** Scale in animation */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

/** Page transition variants */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// ============================================
// List & Stagger Animations
// ============================================

/** Container variant for staggered children */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

/** Individual list item variant */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springGentle,
  },
};

/** Fast stagger for many items */
export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.02,
    },
  },
};

// ============================================
// Interactive Animations
// ============================================

/** Button tap animation values */
export const buttonTap = {
  scale: 0.97,
};

/** Button hover animation values (non-touch) */
export const buttonHover = {
  scale: 1.02,
};

/** Card hover animation values */
export const cardHover = {
  y: -4,
  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
};

/** Card tap animation values */
export const cardTap = {
  scale: 0.98,
};

// ============================================
// Reduced Motion Variants
// ============================================

/**
 * Returns reduced motion variants if user prefers reduced motion
 * Provides instant opacity transitions instead of movement
 */
export function getAccessibleVariants(
  variants: Variants,
  prefersReducedMotion: boolean
): Variants {
  if (!prefersReducedMotion) return variants;

  // Return simplified variants with opacity only
  return {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };
}

/**
 * Returns appropriate transition based on motion preference
 */
export function getAccessibleTransition(
  transition: Transition,
  prefersReducedMotion: boolean
): Transition {
  if (!prefersReducedMotion) return transition;

  return {
    duration: 0.01,
  };
}

// ============================================
// Helper Components Props
// ============================================

/** Props for motion-enabled interactive elements */
export interface MotionInteractiveProps {
  whileHover?: object;
  whileTap?: object;
  transition?: Transition;
}

/**
 * Get motion props for buttons with accessibility support
 */
export function getButtonMotionProps(
  prefersReducedMotion: boolean
): MotionInteractiveProps {
  if (prefersReducedMotion) {
    return {};
  }

  return {
    whileTap: buttonTap,
    transition: springTap,
  };
}

/**
 * Get motion props for cards with accessibility support
 */
export function getCardMotionProps(
  prefersReducedMotion: boolean
): MotionInteractiveProps {
  if (prefersReducedMotion) {
    return {};
  }

  return {
    whileHover: cardHover,
    whileTap: cardTap,
    transition: springBounce,
  };
}
