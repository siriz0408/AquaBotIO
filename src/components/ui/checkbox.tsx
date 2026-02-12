"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { triggerHaptic } from "@/hooks/use-haptic-feedback"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text to display next to the checkbox */
  label?: string
  /** Description text below the label */
  description?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, checked, onChange, disabled, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        triggerHaptic("tap")
        onChange?.(e)
      },
      [onChange]
    )

    return (
      <div className={cn("flex items-start gap-3", className)}>
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            ref={ref}
            id={inputId}
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              "h-5 w-5 shrink-0 rounded border border-primary ring-offset-background transition-colors",
              "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              "peer-checked:bg-primary peer-checked:text-primary-foreground",
              "flex items-center justify-center"
            )}
            aria-hidden="true"
          >
            {checked && <Check className="h-4 w-4 text-primary-foreground" />}
          </div>
        </div>
        {(label || description) && (
          <div className="grid gap-1 leading-none">
            {label && (
              <label
                htmlFor={inputId}
                className={cn(
                  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                  disabled && "cursor-not-allowed opacity-70"
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className={cn("text-sm text-muted-foreground", disabled && "opacity-70")}>
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
