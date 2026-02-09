import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  /** Error state for accessibility - adds aria-invalid */
  hasError?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasError, disabled, ...props }, ref) => {
    return (
      <input
        type={type}
        disabled={disabled}
        aria-disabled={disabled}
        aria-invalid={hasError}
        className={cn(
          // Base styles
          "flex h-11 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-sm transition-colors",
          // File input styles
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Placeholder
          "placeholder:text-muted-foreground",
          // Focus ring (improved for WCAG 2.4.7)
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Disabled state (improved contrast for WCAG 1.4.3)
          "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-300",
          // Error state
          hasError && "border-destructive focus-visible:ring-destructive",
          // Default border
          !hasError && "border-input",
          // Responsive text
          "md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
