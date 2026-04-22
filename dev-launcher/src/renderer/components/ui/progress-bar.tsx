import React from 'react'
import { cn } from '@/lib/utils'

// ─── AlignUI ProgressBar ─────────────────────────────────────────────────────
//
// Horizontal fill bar showing completion percentage.
//
// Colors:
//   blue   — default (neutral progress)
//   green  — success / completion
//   orange — warning / near-limit
//   red    — error / over-limit
//
// Sizes:
//   sm  → h-1    (4px)  — very compact, list rows
//   md  → h-1.5  (6px)  — default
//   lg  → h-2.5  (10px) — prominent
//
// Props:
//   value      — current value (0–max)
//   max        — maximum value (default: 100)
//   showLabel  — renders "value/max" or percentage text above bar
//   animated   — smooth width transition on mount/change
//
// Usage:
//   <ProgressBar value={68} />
//   <ProgressBar value={8} max={10} color="orange" showLabel />
//   <ProgressBar value={100} color="green" />

type ProgressColor = 'blue' | 'green' | 'orange' | 'red'
type ProgressSize  = 'sm' | 'md' | 'lg'

const COLORS: Record<ProgressColor, string> = {
  blue:   'bg-blue-500',
  green:  'bg-green-500',
  orange: 'bg-orange-500',
  red:    'bg-red-500',
}

const SIZES: Record<ProgressSize, string> = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2.5',
}

interface ProgressBarProps {
  value:       number
  max?:        number
  color?:      ProgressColor
  size?:       ProgressSize
  showLabel?:  boolean
  animated?:   boolean
  className?:  string
}

export function ProgressBar({
  value, max = 100, color = 'blue', size = 'md',
  showLabel, animated = true, className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-neutral-500 tabular-nums">{value}/{max}</span>
          <span className="text-xs font-medium text-neutral-400 tabular-nums">{Math.round(pct)}%</span>
        </div>
      )}
      <div className={cn('w-full rounded-full bg-neutral-800 overflow-hidden', SIZES[size])}>
        <div
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          style={{ width: `${pct}%` }}
          className={cn(
            'h-full rounded-full',
            animated && 'transition-[width] duration-500 ease-out',
            COLORS[color],
          )}
        />
      </div>
    </div>
  )
}
