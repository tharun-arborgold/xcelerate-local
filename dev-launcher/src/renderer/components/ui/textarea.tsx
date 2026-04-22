import React from 'react'
import { cn } from '@/lib/utils'

// ─── AlignUI Textarea ────────────────────────────────────────────────────────
//
// Multi-line text input. Mirrors Input's visual treatment.
//
// States:
//   default  → border-neutral-700  bg-neutral-900
//   focus    → border-purple-500   ring-2 ring-purple-500/20
//   error    → border-red-500/60   ring-2 ring-red-500/15
//   disabled → opacity-40
//
// Optional character counter (maxLength + showCount).
//
// Usage:
//   <Textarea placeholder="Describe the issue…" rows={4} />
//   <Textarea maxLength={280} showCount />
//   <Textarea hasError />

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?:  boolean
  showCount?: boolean   // shows current/max length below
}

export function Textarea({ hasError, showCount, className, maxLength, value, defaultValue, onChange, ...props }: TextareaProps) {
  const [count, setCount] = React.useState(() =>
    String(value ?? defaultValue ?? '').length
  )

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCount(e.target.value.length)
    onChange?.(e)
  }

  return (
    <div className="flex flex-col gap-1">
      <textarea
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={showCount ? handleChange : onChange}
        className={cn(
          'w-full rounded-lg border bg-neutral-900 px-3 py-2.5',
          'text-sm text-neutral-200 placeholder:text-neutral-500',
          'transition-colors duration-150 focus:outline-none resize-y',
          hasError
            ? 'border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/15'
            : 'border-neutral-700 hover:border-neutral-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      />
      {showCount && maxLength && (
        <p className={cn(
          'text-right text-xs tabular-nums',
          count >= maxLength ? 'text-red-400' : 'text-neutral-600',
        )}>
          {count}/{maxLength}
        </p>
      )}
    </div>
  )
}
