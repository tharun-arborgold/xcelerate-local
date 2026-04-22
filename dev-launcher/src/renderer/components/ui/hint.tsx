import React from 'react'
import { cn } from '@/lib/utils'

// ─── AlignUI Hint ────────────────────────────────────────────────────────────
//
// Helper text placed below a form field. Three semantic variants:
//
//   default → text-neutral-500     — supplementary info
//   error   → text-red-400         — validation message
//   success → text-green-400       — confirmation
//
// Typically paired with <Input> / <Textarea>.
// Usage:
//   <Hint>Must be at least 8 characters</Hint>
//   <Hint variant="error">This field is required</Hint>

interface HintProps {
  variant?:   'default' | 'error' | 'success'
  icon?:      string           // optional Remix Icon class
  children:   React.ReactNode
  className?: string
}

const COLORS: Record<string, string> = {
  default: 'text-neutral-500',
  error:   'text-red-400',
  success: 'text-green-400',
}

export function Hint({ variant = 'default', icon, children, className }: HintProps) {
  return (
    <p className={cn('flex items-center gap-1.5 text-xs', COLORS[variant], className)}>
      {icon && <i className={cn(icon, 'text-xs leading-none shrink-0')} />}
      {children}
    </p>
  )
}
