import React from 'react'
import * as Radix from '@radix-ui/react-radio-group'
import { cn } from '@/lib/utils'

// ─── AlignUI RadioGroup ──────────────────────────────────────────────────────
//
// Single-select option list built on Radix RadioGroup.
// Use when showing 2–5 mutually exclusive options.
// For 6+ options prefer <Select>.
//
// Layout:
//   vertical   — stacked list (default)
//   horizontal — inline row
//
// Each <RadioItem> renders as a row:
//   ○ Label        ← default
//   ○ Label  Description   ← with description prop
//
// Usage:
//   <RadioGroup value={env} onValueChange={setEnv}>
//     <RadioItem value="dev2">dev2</RadioItem>
//     <RadioItem value="uat">uat</RadioItem>
//     <RadioItem value="prod" disabled>prod</RadioItem>
//   </RadioGroup>
//
//   <RadioGroup orientation="horizontal" value={view} onValueChange={setView}>
//     <RadioItem value="list">List</RadioItem>
//     <RadioItem value="grid">Grid</RadioItem>
//   </RadioGroup>

interface RadioGroupProps extends React.ComponentPropsWithoutRef<typeof Radix.Root> {
  orientation?: 'vertical' | 'horizontal'
}

export function RadioGroup({ orientation = 'vertical', className, children, ...props }: RadioGroupProps) {
  return (
    <Radix.Root
      className={cn(
        'flex gap-2',
        orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
        className,
      )}
      {...props}
    >
      {children}
    </Radix.Root>
  )
}

interface RadioItemProps extends React.ComponentPropsWithoutRef<typeof Radix.Item> {
  description?: string
}

export function RadioItem({ description, children, className, ...props }: RadioItemProps) {
  return (
    <label className={cn(
      'flex items-start gap-2.5 cursor-pointer select-none',
      props.disabled && 'opacity-40 cursor-not-allowed',
    )}>
      <Radix.Item
        className={cn(
          'mt-0.5 size-4 shrink-0 rounded-full border border-neutral-600 bg-neutral-900',
          'transition-colors duration-150',
          'data-[state=checked]:border-purple-500 data-[state=checked]:bg-purple-500',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-950',
          'disabled:pointer-events-none',
          className,
        )}
        {...props}
      >
        <Radix.Indicator className="flex items-center justify-center w-full h-full">
          <span className="size-1.5 rounded-full bg-white" />
        </Radix.Indicator>
      </Radix.Item>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-neutral-200 leading-tight">{children}</span>
        {description && (
          <span className="text-xs text-neutral-500 leading-snug">{description}</span>
        )}
      </div>
    </label>
  )
}
