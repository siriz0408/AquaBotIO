"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import {
  useReducedMotion,
  staggerContainer,
  staggerContainerFast,
  staggerItem,
  springGentle,
} from "@/lib/animations";

// ============================================
// AnimatedList Component
// ============================================

export interface AnimatedListProps {
  /** Use faster stagger timing for many items */
  fast?: boolean;
  /** Custom stagger delay between items (seconds) */
  staggerDelay?: number;
  /** Disable animations */
  noAnimation?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Animated list container that staggers children animations.
 * Use with AnimatedListItem for best results.
 */
function AnimatedList({
  className,
  children,
  fast = false,
  staggerDelay,
  noAnimation = false,
}: AnimatedListProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !noAnimation && !prefersReducedMotion;

  // Custom variants if staggerDelay is provided
  const customVariants: Variants | undefined = staggerDelay
    ? {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: staggerDelay,
          },
        },
      }
    : undefined;

  const variants = customVariants ?? (fast ? staggerContainerFast : staggerContainer);

  if (!shouldAnimate) {
    return <ul className={className}>{children}</ul>;
  }

  return (
    <motion.ul
      className={className}
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.ul>
  );
}

// ============================================
// AnimatedListItem Component
// ============================================

export interface AnimatedListItemProps {
  /** Custom animation variants */
  variants?: Variants;
  /** Disable animations */
  noAnimation?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Animated list item that fades in and slides up.
 * Should be used as a child of AnimatedList.
 */
function AnimatedListItem({
  className,
  children,
  variants,
  noAnimation = false,
}: AnimatedListItemProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !noAnimation && !prefersReducedMotion;

  const itemVariants = variants ?? staggerItem;

  if (!shouldAnimate) {
    return <li className={className}>{children}</li>;
  }

  return (
    <motion.li className={className} variants={itemVariants}>
      {children}
    </motion.li>
  );
}

// ============================================
// AnimatedGrid Component
// ============================================

export interface AnimatedGridProps {
  /** Use faster stagger timing for many items */
  fast?: boolean;
  /** Custom stagger delay between items (seconds) */
  staggerDelay?: number;
  /** Disable animations */
  noAnimation?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Animated grid container that staggers children animations.
 * Use with AnimatedGridItem for best results.
 */
function AnimatedGrid({
  className,
  children,
  fast = false,
  staggerDelay,
  noAnimation = false,
}: AnimatedGridProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !noAnimation && !prefersReducedMotion;

  // Custom variants if staggerDelay is provided
  const customVariants: Variants | undefined = staggerDelay
    ? {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: staggerDelay,
          },
        },
      }
    : undefined;

  const variants = customVariants ?? (fast ? staggerContainerFast : staggerContainer);

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

// ============================================
// AnimatedGridItem Component
// ============================================

export interface AnimatedGridItemProps {
  /** Custom animation variants */
  variants?: Variants;
  /** Disable animations */
  noAnimation?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Animated grid item that fades in and slides up.
 * Should be used as a child of AnimatedGrid.
 */
function AnimatedGridItem({
  className,
  children,
  variants,
  noAnimation = false,
}: AnimatedGridItemProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !noAnimation && !prefersReducedMotion;

  const itemVariants = variants ?? staggerItem;

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

// ============================================
// FadeIn Component
// ============================================

export interface FadeInProps {
  /** Delay before animation starts (seconds) */
  delay?: number;
  /** Duration of the animation (seconds) */
  duration?: number;
  /** Direction to slide in from */
  direction?: "up" | "down" | "left" | "right" | "none";
  /** Disable animations */
  noAnimation?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Simple fade-in wrapper component.
 * Useful for animating individual elements on mount.
 */
function FadeIn({
  className,
  children,
  delay = 0,
  duration = 0.3,
  direction = "up",
  noAnimation = false,
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !noAnimation && !prefersReducedMotion;

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  const directionOffset = {
    up: { y: 16 },
    down: { y: -16 },
    left: { x: 16 },
    right: { x: -16 },
    none: {},
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...directionOffset[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        ...springGentle,
        delay,
        duration,
      }}
    >
      {children}
    </motion.div>
  );
}

export {
  AnimatedList,
  AnimatedListItem,
  AnimatedGrid,
  AnimatedGridItem,
  FadeIn,
};
