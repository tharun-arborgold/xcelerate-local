import React, { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

// AlignUI Segmented Control — animated floating background slides to the active option.
// Uses ResizeObserver so the thumb stays accurate if the container resizes.

export interface SegmentedControlOption {
  value: string
  label: string
}

interface SegmentedControlProps {
  options:   SegmentedControlOption[]
  value:     string
  onChange:  (value: string) => void
  className?: string
  style?:    React.CSSProperties
}

export function SegmentedControl({
  options, value, onChange, className, style,
}: SegmentedControlProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null)

  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const activeBtn = container.querySelector<HTMLElement>('[data-state="active"]')
    if (!activeBtn) return
    setThumb({ left: activeBtn.offsetLeft, width: activeBtn.offsetWidth })
  }, [])

  // Re-measure whenever the active value or option list changes
  useEffect(() => { measure() }, [value, options, measure])

  // Re-measure on container resize (e.g. window resize)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    return () => ro.disconnect()
  }, [measure])

  return (
    <div
      ref={containerRef}
      className={cn('relative flex items-center rounded-xl bg-neutral-800/60 p-1', className)}
      style={style}
    >
      {/* Floating thumb */}
      {thumb && (
        <div
          aria-hidden
          className="absolute rounded-lg bg-neutral-700 shadow-sm transition-all duration-150 ease-out pointer-events-none"
          style={{ left: thumb.left, width: thumb.width, top: 4, bottom: 4 }}
        />
      )}

      {options.map(opt => (
        <button
          key={opt.value}
          data-state={opt.value === value ? 'active' : 'inactive'}
          onClick={() => onChange(opt.value)}
          className={cn(
            'relative z-10 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-150 focus:outline-none',
            opt.value === value
              ? 'text-neutral-200'
              : 'text-neutral-500 hover:text-neutral-400',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
