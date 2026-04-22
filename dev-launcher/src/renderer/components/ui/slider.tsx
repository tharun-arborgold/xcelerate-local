import React from 'react'
import * as RadixSlider from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

// ─── AlignUI Slider ──────────────────────────────────────────────────────────
//
// Range input built on Radix Slider. Supports single value and range (two thumbs).
//
// Colors:
//   purple (default), blue, green, orange, red
//
// Sizes:
//   sm  → track h-1    thumb size-3
//   md  → track h-1.5  thumb size-4  (default)
//   lg  → track h-2    thumb size-5
//
// Range mode: pass an array of two values.
//   <Slider value={[20, 80]} onValueChange={...} />
//
// With labels:
//   <Slider value={[v]} showValue /> → shows current value to the right
//
// Usage:
//   <Slider value={[volume]} onValueChange={([v]) => setVolume(v)} max={100} />
//   <Slider value={[min, max]} onValueChange={([a, b]) => setRange([a, b])} />

type SliderColor = 'purple' | 'blue' | 'green' | 'orange' | 'red'
type SliderSize  = 'sm' | 'md' | 'lg'

const RANGE_COLORS: Record<SliderColor, string> = {
  purple: 'bg-purple-500',
  blue:   'bg-blue-500',
  green:  'bg-green-500',
  orange: 'bg-orange-500',
  red:    'bg-red-500',
}

const THUMB_RING: Record<SliderColor, string> = {
  purple: 'focus-visible:ring-purple-500/40',
  blue:   'focus-visible:ring-blue-500/40',
  green:  'focus-visible:ring-green-500/40',
  orange: 'focus-visible:ring-orange-500/40',
  red:    'focus-visible:ring-red-500/40',
}

const TRACK_H: Record<SliderSize, string> = { sm: 'h-1',   md: 'h-1.5', lg: 'h-2'   }
const THUMB_S: Record<SliderSize, string> = { sm: 'size-3', md: 'size-4', lg: 'size-5' }

interface SliderProps extends Omit<React.ComponentPropsWithoutRef<typeof RadixSlider.Root>, 'color'> {
  color?:      SliderColor
  size?:       SliderSize
  showValue?:  boolean     // renders the current value(s) beside the slider
}

export function Slider({ color = 'purple', size = 'md', showValue, className, value, ...props }: SliderProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <RadixSlider.Root
        value={value}
        className="relative flex flex-1 touch-none select-none items-center"
        {...props}
      >
        {/* Track */}
        <RadixSlider.Track className={cn('relative w-full grow overflow-hidden rounded-full bg-neutral-800', TRACK_H[size])}>
          <RadixSlider.Range className={cn('absolute h-full rounded-full', RANGE_COLORS[color])} />
        </RadixSlider.Track>

        {/* Thumb(s) */}
        {(value as number[] | undefined)?.map((_, i) => (
          <RadixSlider.Thumb
            key={i}
            className={cn(
              'block rounded-full bg-white shadow-md ring-offset-neutral-950',
              'transition-transform hover:scale-110 active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
              THUMB_S[size], THUMB_RING[color],
              'disabled:pointer-events-none disabled:opacity-40',
            )}
          />
        ))}
      </RadixSlider.Root>

      {showValue && value && (
        <span className="text-xs text-neutral-400 tabular-nums shrink-0 min-w-[2ch] text-right">
          {Array.isArray(value) ? value.join('–') : value}
        </span>
      )}
    </div>
  )
}
