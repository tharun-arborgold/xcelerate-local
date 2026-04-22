import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// AlignUI-faithful badge/tag variants.
// neutral  → default label (gray)
// running  → green  (service is up)
// starting → yellow (transition in progress)
// stopped  → dim gray (service is down)
// danger   → red    (error state)
// port     → monospace port label
// branch   → purple monospace git branch

export const badgeVariants = cva(
  'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium whitespace-nowrap leading-none',
  {
    variants: {
      variant: {
        neutral:  'bg-neutral-800   text-neutral-400',
        running:  'bg-green-500/10  text-green-400',
        starting: 'bg-yellow-500/10 text-yellow-400',
        stopped:  'bg-neutral-800   text-neutral-500',
        danger:   'bg-red-500/10    text-red-400',
        port:     'bg-neutral-800/60 text-neutral-500 font-mono',
        branch:   'bg-purple-500/10 text-purple-300   font-mono',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
