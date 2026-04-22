import React from 'react'
import { cn } from '@/lib/utils'
import type { StatusVariant } from './status-dot'

// AlignUI StatusBadge — combines a colored dot + label in one pill.
// More semantically specific than the generic Badge for service health states.

const VARIANTS: Record<StatusVariant, { pill: string; dot: string; label: string }> = {
  running:  {
    pill:  'bg-green-500/10',
    dot:   'bg-green-500',
    label: 'text-green-400',
  },
  starting: {
    pill:  'bg-yellow-500/10',
    dot:   'bg-yellow-500 animate-pulse',
    label: 'text-yellow-400',
  },
  stopped: {
    pill:  'bg-neutral-800',
    dot:   'bg-neutral-600',
    label: 'text-neutral-500',
  },
  unknown: {
    pill:  'bg-neutral-800/60',
    dot:   'bg-neutral-700',
    label: 'text-neutral-600',
  },
}

interface StatusBadgeProps {
  variant:   StatusVariant
  label?:    string           // defaults to the variant name
  className?: string
}

export function StatusBadge({ variant, label, className }: StatusBadgeProps) {
  const c = VARIANTS[variant]
  const text = label ?? variant

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap',
        c.pill, c.label,
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', c.dot)} />
      {text}
    </span>
  )
}
