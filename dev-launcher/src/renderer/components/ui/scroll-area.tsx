import React from 'react'
import * as RadixScrollArea from '@radix-ui/react-scroll-area'
import { cn } from '@/lib/utils'

// ─── AlignUI ScrollArea ──────────────────────────────────────────────────────
//
// Custom-styled scrollable container via Radix ScrollArea.
// Replaces native OS scrollbars with a thin, AlignUI-styled track + thumb.
//
// Design:
//   - Scrollbar width: 6px (vertical), 6px (horizontal)
//   - Track: transparent (invisible when idle)
//   - Thumb: bg-neutral-700, rounded-full
//   - Hover: bg-neutral-600 (subtly more visible)
//   - Auto-hides after scroll ends (Radix default behavior)
//
// Usage:
//   <ScrollArea className="h-64">
//     {longContent}
//   </ScrollArea>
//
//   <ScrollArea className="h-full w-80" orientation="both">
//     {wideContent}
//   </ScrollArea>

interface ScrollAreaProps {
  children:     React.ReactNode
  className?:   string
  orientation?: 'vertical' | 'horizontal' | 'both'
}

export function ScrollArea({ children, className, orientation = 'vertical' }: ScrollAreaProps) {
  const showV = orientation !== 'horizontal'
  const showH = orientation !== 'vertical'

  return (
    <RadixScrollArea.Root
      className={cn('overflow-hidden', className)}
      scrollHideDelay={600}
    >
      <RadixScrollArea.Viewport className="size-full">
        {children}
      </RadixScrollArea.Viewport>

      {showV && (
        <RadixScrollArea.Scrollbar
          orientation="vertical"
          className="flex touch-none select-none transition-opacity w-1.5 p-px"
        >
          <RadixScrollArea.Thumb className="flex-1 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors" />
        </RadixScrollArea.Scrollbar>
      )}

      {showH && (
        <RadixScrollArea.Scrollbar
          orientation="horizontal"
          className="flex touch-none select-none transition-opacity h-1.5 flex-col p-px"
        >
          <RadixScrollArea.Thumb className="flex-1 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors" />
        </RadixScrollArea.Scrollbar>
      )}

      {orientation === 'both' && (
        <RadixScrollArea.Corner className="bg-neutral-900" />
      )}
    </RadixScrollArea.Root>
  )
}
