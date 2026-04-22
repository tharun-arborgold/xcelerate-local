import React from 'react'
import * as RadixTooltip from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

// AlignUI Tooltip — dark variant, built on Radix UI.
// Wrap your app root with <TooltipProvider> once.

export const TooltipProvider = RadixTooltip.Provider

interface TooltipProps {
  content:     React.ReactNode
  children:    React.ReactElement
  side?:       'top' | 'bottom' | 'left' | 'right'
  sideOffset?: number
  delayDuration?: number
}

export function Tooltip({
  content,
  children,
  side        = 'top',
  sideOffset  = 6,
  delayDuration = 400,
}: TooltipProps) {
  return (
    <RadixTooltip.Root delayDuration={delayDuration}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={sideOffset}
          className={cn(
            'z-50 px-2.5 py-1 rounded-lg text-xs font-medium',
            'bg-neutral-800 text-neutral-200 border border-neutral-700',
            'shadow-[0_12px_24px_0_#0e121b0f,0_1px_2px_0_#0e121b08]',
            'animate-in fade-in-0 zoom-in-95 duration-100',
            'data-[side=top]:slide-in-from-bottom-1',
            'data-[side=bottom]:slide-in-from-top-1',
            'data-[side=left]:slide-in-from-right-1',
            'data-[side=right]:slide-in-from-left-1',
          )}
        >
          {content}
          <RadixTooltip.Arrow className="fill-neutral-700" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
