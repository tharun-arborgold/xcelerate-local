import React from 'react'
import { cn } from '@/lib/utils'

// ─── AlignUI ProgressCircle ──────────────────────────────────────────────────
//
// Radial SVG progress ring with percentage label in the center.
// AlignUI sizes: 80, 72, 64, 56, 48, 44px (mapped to named sizes here).
//
// Sizes:
//   xs  → 44px
//   sm  → 56px
//   md  → 72px  (default)
//   lg  → 80px
//
// Colors: blue (default), green, orange, red, purple
//
// Usage:
//   <ProgressCircle value={72} />
//   <ProgressCircle value={40} max={50} color="orange" size="sm" />
//   <ProgressCircle value={100} color="green">
//     <i className="ri-check-line text-green-400" />  ← custom center content
//   </ProgressCircle>

type CircleColor = 'blue' | 'green' | 'orange' | 'red' | 'purple'
type CircleSize  = 'xs' | 'sm' | 'md' | 'lg'

const SIZE_PX: Record<CircleSize, number> = { xs: 44, sm: 56, md: 72, lg: 80 }
const STROKE_W: Record<CircleSize, number> = { xs: 4, sm: 4.5, md: 5, lg: 6 }

const TRACK_COLOR  = 'stroke-neutral-800'
const FILL_COLORS: Record<CircleColor, string> = {
  blue:   'stroke-blue-500',
  green:  'stroke-green-500',
  orange: 'stroke-orange-500',
  red:    'stroke-red-500',
  purple: 'stroke-purple-500',
}

const LABEL_SIZES: Record<CircleSize, string> = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

interface ProgressCircleProps {
  value:       number
  max?:        number
  color?:      CircleColor
  size?:       CircleSize
  showLabel?:  boolean          // show percentage in center (default: true)
  children?:   React.ReactNode  // override center content
  className?:  string
}

export function ProgressCircle({
  value, max = 100, color = 'blue', size = 'md',
  showLabel = true, children, className,
}: ProgressCircleProps) {
  const pct    = Math.min(100, Math.max(0, (value / max) * 100))
  const px     = SIZE_PX[size]
  const sw     = STROKE_W[size]
  const r      = (px - sw) / 2
  const circum = 2 * Math.PI * r
  const dash   = circum * (pct / 100)

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: px, height: px }}
    >
      <svg width={px} height={px} className="-rotate-90">
        {/* Track */}
        <circle
          cx={px / 2} cy={px / 2} r={r}
          fill="none"
          strokeWidth={sw}
          className={TRACK_COLOR}
        />
        {/* Fill */}
        <circle
          cx={px / 2} cy={px / 2} r={r}
          fill="none"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circum}`}
          className={cn(FILL_COLORS[color], 'transition-[stroke-dasharray] duration-500 ease-out')}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children ?? (
          showLabel && (
            <span className={cn('font-semibold text-neutral-200 tabular-nums', LABEL_SIZES[size])}>
              {Math.round(pct)}%
            </span>
          )
        )}
      </div>
    </div>
  )
}
