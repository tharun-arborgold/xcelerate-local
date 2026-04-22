import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ─── AlignUI Tag ─────────────────────────────────────────────────────────────
//
// Dismissible label chip. Like Badge but interactive — has an ×  close button.
// Used for filter chips, selected values, categorization labels.
//
// Variants:
//   stroke → bordered, transparent bg  (default) — filter chips
//   gray   → neutral-800 filled bg               — category labels
//
// Colors (10 palette options matching AlignUI Badge):
//   neutral, blue, orange, red, green, yellow, purple, sky, pink, teal
//
// Usage:
//   <Tag>React</Tag>
//   <Tag onRemove={() => removeFilter('react')}>React</Tag>
//   <Tag color="purple" variant="stroke">Feature</Tag>

type TagColor = 'neutral' | 'blue' | 'orange' | 'red' | 'green' | 'yellow' | 'purple' | 'sky' | 'pink' | 'teal'

const COLOR_STROKE: Record<TagColor, string> = {
  neutral: 'border-neutral-700   text-neutral-400',
  blue:    'border-blue-500/30   text-blue-400',
  orange:  'border-orange-500/30 text-orange-400',
  red:     'border-red-500/30    text-red-400',
  green:   'border-green-500/30  text-green-400',
  yellow:  'border-yellow-500/30 text-yellow-400',
  purple:  'border-purple-500/30 text-purple-400',
  sky:     'border-sky-500/30    text-sky-400',
  pink:    'border-pink-500/30   text-pink-400',
  teal:    'border-teal-500/30   text-teal-400',
}

const COLOR_GRAY: Record<TagColor, string> = {
  neutral: 'bg-neutral-800   text-neutral-300',
  blue:    'bg-blue-500/15   text-blue-300',
  orange:  'bg-orange-500/15 text-orange-300',
  red:     'bg-red-500/15    text-red-300',
  green:   'bg-green-500/15  text-green-300',
  yellow:  'bg-yellow-500/15 text-yellow-300',
  purple:  'bg-purple-500/15 text-purple-300',
  sky:     'bg-sky-500/15    text-sky-300',
  pink:    'bg-pink-500/15   text-pink-300',
  teal:    'bg-teal-500/15   text-teal-300',
}

interface TagProps {
  variant?:   'stroke' | 'gray'
  color?:     TagColor
  onRemove?:  () => void
  children:   React.ReactNode
  className?: string
}

export function Tag({ variant = 'stroke', color = 'neutral', onRemove, children, className }: TagProps) {
  const colors = variant === 'stroke' ? COLOR_STROKE[color] : COLOR_GRAY[color]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
        'text-xs font-medium whitespace-nowrap',
        variant === 'stroke' ? 'border bg-transparent' : '',
        colors,
        className,
      )}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity rounded-full -mr-0.5"
          aria-label="Remove"
        >
          <i className="ri-close-line text-[10px] leading-none" />
        </button>
      )}
    </span>
  )
}
