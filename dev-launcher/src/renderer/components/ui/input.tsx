import React from 'react'
import { cn } from '@/lib/utils'

// ─── AlignUI Input ───────────────────────────────────────────────────────────
//
// Text input following AlignUI's form field conventions.
//
// Sizes (match AlignUI's medium/small/xsmall):
//   md  → h-9  px-3  text-sm   — default, most forms
//   sm  → h-8  px-2.5 text-sm  — compact forms
//   xs  → h-7  px-2  text-xs   — dense/inline
//
// Composition slots:
//   prefix    — icon/text prepended inside the border (e.g. search icon)
//   suffix    — icon/text appended inside the border (e.g. clear button)
//
// States:
//   default   → border-neutral-700   bg-neutral-900
//   hover     → border-neutral-600
//   focus     → border-purple-500    ring-2 ring-purple-500/20
//   error     → border-red-500/60    ring-2 ring-red-500/15  (hasError prop)
//   disabled  → opacity-40           cursor-not-allowed
//
// Usage:
//   <Input placeholder="Search…" />
//   <Input size="sm" hasError />
//   <Input prefix={<i className="ri-search-line" />} />

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?:      'md' | 'sm' | 'xs'
  hasError?:  boolean
  prefix?:    React.ReactNode   // rendered inside border, left
  suffix?:    React.ReactNode   // rendered inside border, right
  wrapperClassName?: string
}

const HEIGHTS: Record<string, string> = {
  md: 'h-9  px-3   text-sm',
  sm: 'h-8  px-2.5 text-sm',
  xs: 'h-7  px-2   text-xs',
}

export function Input({
  size = 'md',
  hasError,
  prefix,
  suffix,
  className,
  wrapperClassName,
  disabled,
  ...props
}: InputProps) {
  const hasSides = prefix || suffix

  const wrapperBase = cn(
    'flex items-center rounded-lg border bg-neutral-900 transition-colors duration-150',
    'focus-within:outline-none',
    hasError
      ? 'border-red-500/60 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/15'
      : 'border-neutral-700 hover:border-neutral-600 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20',
    disabled && 'opacity-40 cursor-not-allowed',
    HEIGHTS[size],
    hasSides ? 'gap-2' : '',
    wrapperClassName,
  )

  const inputBase = cn(
    'flex-1 bg-transparent text-neutral-200 placeholder:text-neutral-500',
    'focus:outline-none disabled:cursor-not-allowed',
    // When wrapped, remove padding from input itself — wrapper provides it
    hasSides && 'px-0',
    !hasSides && HEIGHTS[size].split(/\s+/).filter(c => c.startsWith('px-')).join(' '),
    className,
  )

  return (
    <div className={wrapperBase}>
      {prefix && (
        <span className="shrink-0 text-neutral-500 leading-none">{prefix}</span>
      )}
      <input
        className={inputBase}
        disabled={disabled}
        {...props}
      />
      {suffix && (
        <span className="shrink-0 text-neutral-500 leading-none">{suffix}</span>
      )}
    </div>
  )
}
