import React from 'react'
import { cn } from '@/lib/utils'

export type StatusVariant = 'running' | 'starting' | 'stopped' | 'unknown'

// Small colored dot indicating service health.
// running  → solid green
// starting → pulsing yellow (transition in progress)
// stopped  → dim gray
// unknown  → darker gray (state not yet polled)

export function StatusDot({ variant }: { variant: StatusVariant }) {
  return (
    <span
      className={cn(
        'w-2 h-2 rounded-full shrink-0',
        variant === 'running'  && 'bg-green-500',
        variant === 'starting' && 'bg-yellow-500 animate-pulse',
        variant === 'stopped'  && 'bg-neutral-600',
        variant === 'unknown'  && 'bg-neutral-700',
      )}
    />
  )
}
