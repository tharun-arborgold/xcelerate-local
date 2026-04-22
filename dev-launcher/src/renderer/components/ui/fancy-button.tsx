import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ─── AlignUI FancyButton ─────────────────────────────────────────────────────
//
// High-emphasis button with gradient fill and shimmer sweep on hover.
// Use sparingly — one per page max (hero CTAs, onboarding).
//
// Variants:
//   primary     → purple gradient (default)
//   neutral     → slate gradient
//   destructive → red gradient
//   basic       → solid white text, no gradient (for dark hero sections)
//
// Sizes:
//   md  → h-9   px-4   text-sm  (default)
//   sm  → h-8   px-3.5 text-sm
//   xs  → h-7   px-3   text-xs
//
// Shimmer: a pseudo-element white gradient sweeps left→right on hover.
// Implemented via a <span> overlay since Tailwind can't animate pseudo-elements.

const fancyVariants = cva(
  [
    'relative inline-flex items-center justify-center gap-2',
    'font-medium overflow-hidden rounded-lg',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-950',
    'disabled:pointer-events-none disabled:opacity-40',
    // Shimmer child
    '[&_.shimmer]:absolute [&_.shimmer]:inset-0',
    '[&_.shimmer]:bg-[linear-gradient(105deg,transparent_40%,rgba(255,255,255,0.18)_50%,transparent_60%)]',
    '[&_.shimmer]:translate-x-[-100%] [&:hover_.shimmer]:translate-x-[100%]',
    '[&_.shimmer]:transition-transform [&_.shimmer]:duration-500 [&_.shimmer]:ease-out',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-lg shadow-purple-500/25',
          'hover:from-purple-300 hover:to-purple-500',
          'focus-visible:ring-purple-500/50',
        ],
        neutral: [
          'bg-gradient-to-br from-neutral-600 to-neutral-800 text-white shadow-lg shadow-neutral-900/40',
          'hover:from-neutral-500 hover:to-neutral-700',
          'focus-visible:ring-neutral-500/50',
        ],
        destructive: [
          'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-lg shadow-red-500/25',
          'hover:from-red-300 hover:to-red-500',
          'focus-visible:ring-red-500/50',
        ],
        basic: [
          'bg-neutral-900 border border-neutral-700 text-white',
          'hover:bg-neutral-800 hover:border-neutral-600',
          'focus-visible:ring-neutral-500/50',
        ],
      },
      size: {
        md: 'h-9  px-4   text-sm',
        sm: 'h-8  px-3.5 text-sm',
        xs: 'h-7  px-3   text-xs',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

interface FancyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof fancyVariants> {}

export function FancyButton({ variant, size, className, children, ...props }: FancyButtonProps) {
  return (
    <button className={cn(fancyVariants({ variant, size }), className)} {...props}>
      <span className="shimmer" aria-hidden="true" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  )
}
