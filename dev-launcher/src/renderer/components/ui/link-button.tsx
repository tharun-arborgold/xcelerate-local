import React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ─── AlignUI LinkButton ──────────────────────────────────────────────────────
//
// Text-only button that reads as a hyperlink. No background, no border.
// Use for inline actions within prose, footer nav, breadcrumb CTAs.
//
// Colors:
//   gray    → text-neutral-400  hover:text-neutral-200  (default)
//   primary → text-purple-400   hover:text-purple-300
//   error   → text-red-400      hover:text-red-300
//
// Sizes:
//   md  → text-sm  (default)
//   sm  → text-xs
//
// Underline:
//   underline prop adds a persistent underline (vs hover-only default).
//
// asChild: renders as Slot — use for <a href> wrapping.
//   <LinkButton asChild><a href="/docs">Docs</a></LinkButton>

const linkVariants = cva(
  [
    'inline-flex items-center gap-1.5 font-medium',
    'transition-colors duration-150 ease-out',
    'focus-visible:outline-none focus-visible:underline',
    'disabled:pointer-events-none disabled:opacity-40',
    'hover:underline underline-offset-2',
  ],
  {
    variants: {
      color: {
        gray:    'text-neutral-400 hover:text-neutral-200',
        primary: 'text-purple-400  hover:text-purple-300',
        error:   'text-red-400     hover:text-red-300',
      },
      size: {
        md: 'text-sm',
        sm: 'text-xs',
      },
    },
    defaultVariants: { color: 'gray', size: 'md' },
  },
)

interface LinkButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof linkVariants> {
  asChild?: boolean
}

export function LinkButton({ color, size, asChild, className, ...props }: LinkButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(linkVariants({ color, size }), className)} {...props} />
}
