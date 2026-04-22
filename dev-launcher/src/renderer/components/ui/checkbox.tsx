import React from 'react'
import * as RadixCheckbox from '@radix-ui/react-checkbox'
import { cn } from '@/lib/utils'

// ─── AlignUI Checkbox ────────────────────────────────────────────────────────
//
// Single check control built on Radix Checkbox.
//
// Sizes:
//   md → 18px square — default
//   sm → 14px square — dense tables
//
// States:
//   unchecked     → border border-neutral-600  bg-neutral-900
//   checked       → bg-purple-500              border-purple-500   white checkmark
//   indeterminate → bg-purple-500/20            border-purple-400   dash indicator
//   disabled      → opacity-40
//   focus         → ring-2 ring-purple-500/30
//
// Usage:
//   <Checkbox checked={val} onCheckedChange={setVal} />
//   <Checkbox checked="indeterminate" />
//
// Pair with Label:
//   <div className="flex items-center gap-2">
//     <Checkbox id="cb" />
//     <Label htmlFor="cb">Accept terms</Label>
//   </div>

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof RadixCheckbox.Root> {
  size?: 'md' | 'sm'
}

export function Checkbox({ size = 'md', className, ...props }: CheckboxProps) {
  const box = size === 'sm' ? 'size-3.5 rounded' : 'size-[18px] rounded-md'
  const icon = size === 'sm' ? 'text-[9px]' : 'text-[11px]'

  return (
    <RadixCheckbox.Root
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        'border border-neutral-600 bg-neutral-900',
        'transition-colors duration-150',
        'data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500',
        'data-[state=indeterminate]:bg-purple-500/20 data-[state=indeterminate]:border-purple-400',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-950',
        'disabled:pointer-events-none disabled:opacity-40',
        'cursor-pointer',
        box,
        className,
      )}
      {...props}
    >
      <RadixCheckbox.Indicator className="flex items-center justify-center text-white">
        {props.checked === 'indeterminate'
          ? <i className={cn('ri-subtract-line leading-none', icon)} />
          : <i className={cn('ri-check-line leading-none font-bold', icon)} />
        }
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  )
}
