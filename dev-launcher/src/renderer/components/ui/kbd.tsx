import React from 'react'
import { cn } from '@/lib/utils'

// ─── AlignUI Kbd ─────────────────────────────────────────────────────────────
//
// Keyboard shortcut display. Renders a styled <kbd> element.
//
// Design:
//   - bg-neutral-800/80  border border-neutral-700
//   - text-neutral-400   text-xs  font-mono
//   - rounded-md  px-1.5  py-0.5
//   - subtle bottom shadow to suggest a physical key
//
// Usage:
//   <Kbd>⌘K</Kbd>
//   <Kbd>Ctrl</Kbd>
//   <span className="flex items-center gap-1">
//     <Kbd>⌘</Kbd><Kbd>Shift</Kbd><Kbd>P</Kbd>
//   </span>

interface KbdProps {
  children:   React.ReactNode
  className?: string
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-md border border-neutral-700 bg-neutral-800/80',
        'px-1.5 py-px',
        'text-[11px] font-mono leading-5 text-neutral-400',
        'shadow-[0_1px_0_0_theme(colors.neutral.700)]',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
