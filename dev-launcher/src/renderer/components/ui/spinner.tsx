import React from 'react'
import { cn } from '@/lib/utils'

// ─── AlignUI Spinner ────────────────────────────────────────────────────────
//
// A simple animated loading indicator using Remix Icons.
//
// Sizes:
//   sm  → text-sm  (14px) — inline use inside buttons/rows
//   md  → text-base (16px) — default, standalone loaders
//   lg  → text-xl  (20px) — full-page / card loading states
//
// Color inherits from parent (currentColor) — wrap in text-* to tint.
// Usage:
//   <Spinner />                  → default md, inherits color
//   <Spinner size="sm" />        → small inline
//   <Spinner className="text-purple-400" />

const SIZE: Record<string, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
}

interface SpinnerProps {
  size?:      'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <i
      className={cn('ri-loader-4-line animate-spin leading-none', SIZE[size], className)}
      aria-label="Loading"
      role="status"
    />
  )
}
