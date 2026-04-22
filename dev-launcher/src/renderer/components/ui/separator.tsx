import React from 'react'
import * as RadixSeparator from '@radix-ui/react-separator'
import { cn } from '@/lib/utils'

// ─── AlignUI Separator / Divider ─────────────────────────────────────────────
//
// Visual divider using Radix Separator (semantic role="separator").
//
// Orientations:
//   horizontal → full-width 1px line  (default)
//   vertical   → full-height 1px line
//
// Variants:
//   default → bg-neutral-800  — standard section divider
//   strong  → bg-neutral-700  — more prominent
//   soft    → bg-neutral-800/60 — very subtle
//
// Usage:
//   <Separator />
//   <Separator orientation="vertical" className="h-4" />
//   <Separator variant="strong" />

interface SeparatorProps extends React.ComponentPropsWithoutRef<typeof RadixSeparator.Root> {
  variant?: 'default' | 'strong' | 'soft'
}

const VARIANTS: Record<string, string> = {
  default: 'bg-neutral-800',
  strong:  'bg-neutral-700',
  soft:    'bg-neutral-800/60',
}

export function Separator({ variant = 'default', className, orientation = 'horizontal', ...props }: SeparatorProps) {
  return (
    <RadixSeparator.Root
      orientation={orientation}
      decorative
      className={cn(
        'shrink-0',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  )
}
