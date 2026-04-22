import React from 'react'
import * as Radix from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'

// ─── AlignUI Popover ─────────────────────────────────────────────────────────
//
// Anchored floating panel built on Radix Popover.
// Unlike Tooltip (read-only), Popover can contain interactive content.
//
// Use for: filter panels, quick-edit forms, color pickers, date pickers,
//          info cards, user profile previews.
//
// Anatomy:
//   <Popover>                   ← root (controls open state)
//     <PopoverTrigger asChild>  ← element that opens the panel
//       <Button>Filter</Button>
//     </PopoverTrigger>
//     <PopoverContent>          ← the floating panel
//       …content…
//     </PopoverContent>
//   </Popover>
//
// Positioning:
//   side:  top | right | bottom (default) | left
//   align: start | center (default) | end
//   sideOffset: px gap between trigger and panel (default: 8)
//
// showArrow: renders a small triangle pointing at the trigger (optional)

export const Popover        = Radix.Root
export const PopoverTrigger = Radix.Trigger
export const PopoverClose   = Radix.Close
export const PopoverAnchor  = Radix.Anchor

interface PopoverContentProps extends React.ComponentPropsWithoutRef<typeof Radix.Content> {
  showArrow?: boolean
}

export function PopoverContent({
  showArrow = false,
  align = 'center',
  side = 'bottom',
  sideOffset = 8,
  className,
  children,
  ...props
}: PopoverContentProps) {
  return (
    <Radix.Portal>
      <Radix.Content
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={cn(
          'z-50 rounded-xl border border-neutral-700 bg-neutral-800 shadow-xl',
          'min-w-[200px]',
          // Entry animations
          'data-[state=open]:animate-in   data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2',
          'data-[side=top]:slide-in-from-bottom-2',
          'data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2',
          className,
        )}
        {...props}
      >
        {children}
        {showArrow && (
          <Radix.Arrow className="fill-neutral-700" width={12} height={6} />
        )}
      </Radix.Content>
    </Radix.Portal>
  )
}

// ── Convenience sub-components ────────────────────────────────────────────────

export function PopoverHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between px-4 py-3 border-b border-neutral-700', className)}>
      {children}
    </div>
  )
}

export function PopoverBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-4 py-3', className)}>{children}</div>
}

export function PopoverFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-end gap-2 px-4 py-3 border-t border-neutral-700', className)}>
      {children}
    </div>
  )
}
