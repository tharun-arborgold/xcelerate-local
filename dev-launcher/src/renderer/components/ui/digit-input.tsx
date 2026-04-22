import React, { useRef } from 'react'
import { cn } from '@/lib/utils'

// ─── AlignUI DigitInput ──────────────────────────────────────────────────────
//
// OTP / PIN / Verification code input. Renders N individual single-digit boxes.
// Auto-advances focus on input. Backspace moves back. Supports paste of full code.
//
// Sizes:
//   sm  → size-8  (32px)  — compact
//   md  → size-10 (40px)  — default
//   lg  → size-12 (48px)  — hero / prominent
//
// length: number of digits (default: 6)
// type:   'numeric' (0-9 only) | 'alphanumeric' | 'text'
//
// Usage:
//   const [code, setCode] = React.useState('')
//   <DigitInput length={6} value={code} onChange={setCode} />
//   <DigitInput length={4} type="numeric" size="md" />

type DigitSize = 'sm' | 'md' | 'lg'

const SIZES: Record<DigitSize, string> = {
  sm: 'size-8  text-sm',
  md: 'size-10 text-base',
  lg: 'size-12 text-lg',
}

interface DigitInputProps {
  length?:    number
  value?:     string
  onChange?:  (value: string) => void
  type?:      'numeric' | 'alphanumeric' | 'text'
  size?:      DigitSize
  hasError?:  boolean
  disabled?:  boolean
  className?: string
}

export function DigitInput({
  length = 6, value = '', onChange, type = 'numeric',
  size = 'md', hasError, disabled, className,
}: DigitInputProps) {
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')
  const refs   = useRef<(HTMLInputElement | null)[]>([])

  const update = (idx: number, ch: string) => {
    const next = digits.map((d, i) => (i === idx ? ch : d)).join('')
    onChange?.(next)
  }

  const onKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        update(idx, '')
      } else if (idx > 0) {
        update(idx - 1, '')
        refs.current[idx - 1]?.focus()
      }
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      refs.current[idx - 1]?.focus()
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      refs.current[idx + 1]?.focus()
    }
  }

  const onInput = (idx: number, e: React.FormEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value
    const ch  = raw.slice(-1)

    if (type === 'numeric' && !/^\d$/.test(ch)) return
    if (type === 'alphanumeric' && !/^[a-zA-Z0-9]$/.test(ch)) return

    update(idx, ch.toUpperCase())
    if (ch && idx < length - 1) refs.current[idx + 1]?.focus()
  }

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').slice(0, length)
    const filtered = type === 'numeric'
      ? text.replace(/\D/g, '')
      : type === 'alphanumeric'
        ? text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
        : text.toUpperCase()
    onChange?.(filtered.padEnd(value.length, '').slice(0, length))
    // Focus last filled digit or end
    const nextFocus = Math.min(filtered.length, length - 1)
    refs.current[nextFocus]?.focus()
  }

  return (
    <div className={cn('flex items-center gap-2', className)} onPaste={onPaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          value={d}
          type={type === 'numeric' ? 'tel' : 'text'}
          inputMode={type === 'numeric' ? 'numeric' : 'text'}
          maxLength={1}
          disabled={disabled}
          onChange={() => {}} // controlled via onInput
          onInput={e => onInput(i, e)}
          onKeyDown={e => onKeyDown(i, e)}
          onFocus={e => e.target.select()}
          className={cn(
            'flex items-center justify-center text-center rounded-lg font-mono font-semibold',
            'border bg-neutral-900 text-neutral-200',
            'transition-colors duration-150 outline-none',
            hasError
              ? 'border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/15'
              : 'border-neutral-700 hover:border-neutral-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            SIZES[size],
          )}
        />
      ))}
    </div>
  )
}
