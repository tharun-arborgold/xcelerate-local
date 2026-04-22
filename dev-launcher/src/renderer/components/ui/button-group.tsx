import React from 'react'
import { cn } from '@/lib/utils'

// ─── AlignUI ButtonGroup ─────────────────────────────────────────────────────
//
// Joins buttons edge-to-edge, collapsing their shared borders into one.
// Children should be <Button> components — the group handles radius/border merging.
//
// Orientation:
//   horizontal (default) — left-to-right row
//   vertical             — top-to-bottom column
//
// Usage:
//   <ButtonGroup>
//     <Button variant="ghost">Day</Button>
//     <Button variant="ghost">Week</Button>
//     <Button variant="ghost">Month</Button>
//   </ButtonGroup>

interface ButtonGroupProps {
  orientation?: 'horizontal' | 'vertical'
  children:     React.ReactNode
  className?:   string
}

export function ButtonGroup({ orientation = 'horizontal', children, className }: ButtonGroupProps) {
  return (
    <div
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        // Collapse shared borders and square off inner corners
        '[&>*]:rounded-none',
        orientation === 'horizontal' && [
          '[&>*:not(:last-child)]:-mr-px',           // overlap borders
          '[&>*:first-child]:rounded-l-lg',
          '[&>*:last-child]:rounded-r-lg',
        ],
        orientation === 'vertical' && [
          '[&>*:not(:last-child)]:-mb-px',
          '[&>*:first-child]:rounded-t-lg',
          '[&>*:last-child]:rounded-b-lg',
        ],
        className,
      )}
    >
      {children}
    </div>
  )
}
