import React from 'react'
import * as RadixSwitch from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

// ─── AlignUI Switch / Toggle ─────────────────────────────────────────────────
//
// Binary on/off control built on Radix Switch for full a11y.
//
// Sizes:
//   md  → track 36×20px, thumb 16px  — default
//   sm  → track 28×16px, thumb 12px  — compact rows
//
// States:
//   unchecked → bg-neutral-700
//   checked   → bg-purple-500
//   disabled  → opacity-40
//   focus     → ring-2 ring-purple-500/30
//
// Usage:
//   <Switch checked={val} onCheckedChange={setVal} />
//   <Switch size="sm" />
//
// Pair with <Label> for accessible form fields:
//   <div className="flex items-center gap-2">
//     <Switch id="sw" />
//     <Label htmlFor="sw">Enable feature</Label>
//   </div>

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof RadixSwitch.Root> {
  size?: 'md' | 'sm'
}

export function Switch({ size = 'md', className, ...props }: SwitchProps) {
  const track = size === 'sm'
    ? 'h-4 w-7'
    : 'h-5 w-9'

  const thumb = size === 'sm'
    ? 'size-3 data-[state=checked]:translate-x-3'
    : 'size-4 data-[state=checked]:translate-x-4'

  return (
    <RadixSwitch.Root
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center rounded-full',
        'transition-colors duration-200 ease-out',
        'bg-neutral-700 data-[state=checked]:bg-purple-500',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-950',
        'disabled:pointer-events-none disabled:opacity-40',
        track,
        className,
      )}
      {...props}
    >
      <RadixSwitch.Thumb
        className={cn(
          'pointer-events-none block rounded-full bg-white shadow-sm',
          'translate-x-0.5 transition-transform duration-200 ease-out',
          thumb,
        )}
      />
    </RadixSwitch.Root>
  )
}
