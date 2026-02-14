"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useReducedMotion, pageTransition, transitionDefault } from "@/lib/animations";

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Page transition wrapper that provides smooth fade/slide animations
 * between route changes. Respects prefers-reduced-motion.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  // Skip animations if user prefers reduced motion
  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transitionDefault}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
