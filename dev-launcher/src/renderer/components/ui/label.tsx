import React from 'react'
import * as RadixLabel from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

// ─── AlignUI Label ───────────────────────────────────────────────────────────
//
// Associates a form label with its input (Radix primitive for a11y).
//
// Design:
//   - text-sm font-medium text-neutral-300
//   - Optional asterisk (*) for required fields — red, no space-announce
//   - Disabled state → opacity-40 cursor-not-allowed
//
// Usage:
//   <Label htmlFor="email">Email</Label>
//   <Label htmlFor="name" required>Name</Label>
//   <Label htmlFor="field" disabled>Disabled</Label>

interface LabelProps extends React.ComponentPropsWithoutRef<typeof RadixLabel.Root> {
  required?:  boolean
  disabled?:  boolean
}

export function Label({ required, disabled, children, className, ...props }: LabelProps) {
  return (
    <RadixLabel.Root
      className={cn(
        'text-sm font-medium text-neutral-300 leading-none select-none',
        disabled && 'opacity-40 cursor-not-allowed',
        className,
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-1 text-red-400" aria-hidden="true">*</span>
      )}
    </RadixLabel.Root>
  )
}
