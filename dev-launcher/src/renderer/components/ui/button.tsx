import React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ─── AlignUI Button ──────────────────────────────────────────────────────────
//
// Covers AlignUI's primary interactive action patterns.
//
// Variants:
//   primary  → filled purple      — single primary action per view
//   ghost    → bordered neutral   — secondary / cancel actions
//   danger   → red-tinted border  — destructive actions (delete, stop)
//   icon     → borderless square  — AlignUI "compact button"; icon-only actions
//              No border at rest; subtle bg fill on hover.
//
// Sizes:
//   sm  → h-7  px-2.5  text-xs  — row-level actions (pairs with icon btn size-7)
//   md  → h-8  px-3    text-sm  — default; card headers
//   lg  → h-9  px-4    text-sm  — prominent CTAs
//   icon-size is auto-applied when variant="icon" → size-7 (28px square)
//
// asChild prop:
//   Renders as a Radix Slot — passes all props to the first child element.
//   Use when you need a <Link> or <a> that looks like a button.
//   <Button asChild variant="primary"><a href="/start">Open</a></Button>

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-1.5 text-sm font-medium',
    'transition-colors duration-150 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50',
    'disabled:pointer-events-none disabled:opacity-40',
  ],
  {
    variants: {
      variant: {
        primary: [
          'rounded-lg bg-purple-500 text-white',
          'hover:bg-purple-600 active:bg-purple-700',
        ],
        ghost: [
          'rounded-lg border border-neutral-700 text-neutral-400',
          'hover:border-neutral-600 hover:text-neutral-200 hover:bg-neutral-800/50',
          'active:bg-neutral-800',
        ],
        danger: [
          'rounded-lg border border-red-500/20 bg-red-500/5 text-red-400',
          'hover:bg-red-500/15 hover:border-red-500/30',
          'active:bg-red-500/20',
        ],
        // AlignUI compact button: no border at rest; bg fill on hover only
        icon: [
          'rounded-lg text-neutral-500',
          'hover:bg-neutral-800 hover:text-neutral-300',
          'active:bg-neutral-700 active:text-neutral-200',
        ],
      },
      size: {
        sm:   'h-7 px-2.5 text-xs',
        md:   'h-8 px-3',
        lg:   'h-9 px-4',
        icon: 'size-7',   // 28px square — same height as size-sm
      },
    },
    compoundVariants: [
      // icon variant is always square; ignore size prop
      { variant: 'icon', size: 'sm', class: 'size-6' },
    ],
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean  // render as Radix Slot (passes props to child element)
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(
        buttonVariants({ variant, size: variant === 'icon' ? 'icon' : size }),
        className,
      )}
      {...props}
    />
  )
}
