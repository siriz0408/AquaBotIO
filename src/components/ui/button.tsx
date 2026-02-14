"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, type HTMLMotionProps } from "framer-motion"

import { cn } from "@/lib/utils"
import { triggerHaptic } from "@/hooks/use-haptic-feedback"
import { useReducedMotion, springTap, buttonTap } from "@/lib/animations"

const buttonVariants = cva(
  // Base styles with improved disabled state for WCAG AA contrast
  // Changed from opacity-50 to explicit colors for better contrast ratio
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 disabled:bg-gray-400 disabled:text-gray-100",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 disabled:bg-gray-400 disabled:text-gray-100",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 disabled:bg-gray-200 disabled:text-gray-400",
        ghost: "hover:bg-accent hover:text-accent-foreground disabled:text-gray-400",
        link: "text-primary underline-offset-4 hover:underline disabled:text-gray-400 disabled:no-underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-10 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Disable haptic feedback on click */
  noHaptic?: boolean
  /** Disable motion animations */
  noMotion?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, noHaptic = false, noMotion = false, onClick, disabled, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion()
    const shouldAnimate = !noMotion && !prefersReducedMotion && !disabled && !asChild

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!noHaptic) {
          triggerHaptic("tap")
        }
        onClick?.(e)
      },
      [noHaptic, onClick]
    )

    // Use Slot for asChild, otherwise use motion.button or regular button
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          onClick={handleClick}
          {...props}
        />
      )
    }

    if (shouldAnimate) {
      return (
        <motion.button
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          onClick={handleClick}
          disabled={disabled}
          aria-disabled={disabled}
          whileTap={buttonTap}
          transition={springTap}
          {...(props as HTMLMotionProps<"button">)}
        />
      )
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick}
        disabled={disabled}
        aria-disabled={disabled}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
