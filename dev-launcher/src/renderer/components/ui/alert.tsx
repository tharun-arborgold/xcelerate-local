import React from 'react'
import { cn } from '@/lib/utils'

// ─── AlignUI Alert ───────────────────────────────────────────────────────────
//
// Inline status message. AlignUI has four display modes × five statuses.
//
// Variants (visual weight):
//   filled   → solid tinted bg, colored border  — high emphasis
//   light    → very faint bg, colored border    — medium emphasis (default)
//   stroke   → transparent bg, colored border   — low emphasis
//
// Statuses:
//   error       → red     — validation errors, destructive results
//   warning     → yellow  — caution, non-critical issues
//   success     → green   — confirmation, completed actions
//   information → sky     — neutral informational
//   feature     → purple  — new feature callouts
//
// Anatomy:
//   <Alert> wraps an icon + content. Use sub-slots for flexibility:
//     <Alert.Title>   → bold heading line
//     <Alert.Body>    → description text
//
// Usage:
//   <Alert status="error">Invalid configuration</Alert>
//   <Alert status="success" title="Deployed!" variant="light">
//     Your changes are live.
//   </Alert>

type AlertStatus  = 'error' | 'warning' | 'success' | 'information' | 'feature'
type AlertVariant = 'filled' | 'light' | 'stroke'

interface AlertConfig {
  icon:   string
  filled: { bg: string; border: string; text: string; iconColor: string }
  light:  { bg: string; border: string; text: string; iconColor: string }
  stroke: { bg: string; border: string; text: string; iconColor: string }
}

const STATUS: Record<AlertStatus, AlertConfig> = {
  error: {
    icon: 'ri-error-warning-line',
    filled: { bg: 'bg-red-500/15',    border: 'border-red-500/30',   text: 'text-red-300',    iconColor: 'text-red-400'    },
    light:  { bg: 'bg-red-500/8',     border: 'border-red-500/20',   text: 'text-red-400',    iconColor: 'text-red-400'    },
    stroke: { bg: 'bg-transparent',   border: 'border-red-500/30',   text: 'text-red-400',    iconColor: 'text-red-400'    },
  },
  warning: {
    icon: 'ri-alert-line',
    filled: { bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', text: 'text-yellow-300', iconColor: 'text-yellow-400' },
    light:  { bg: 'bg-yellow-500/8',  border: 'border-yellow-500/20', text: 'text-yellow-400', iconColor: 'text-yellow-400' },
    stroke: { bg: 'bg-transparent',   border: 'border-yellow-500/30', text: 'text-yellow-400', iconColor: 'text-yellow-400' },
  },
  success: {
    icon: 'ri-checkbox-circle-line',
    filled: { bg: 'bg-green-500/15',  border: 'border-green-500/30', text: 'text-green-300',  iconColor: 'text-green-400'  },
    light:  { bg: 'bg-green-500/8',   border: 'border-green-500/20', text: 'text-green-400',  iconColor: 'text-green-400'  },
    stroke: { bg: 'bg-transparent',   border: 'border-green-500/30', text: 'text-green-400',  iconColor: 'text-green-400'  },
  },
  information: {
    icon: 'ri-information-line',
    filled: { bg: 'bg-sky-500/15',    border: 'border-sky-500/30',   text: 'text-sky-300',    iconColor: 'text-sky-400'    },
    light:  { bg: 'bg-sky-500/8',     border: 'border-sky-500/20',   text: 'text-sky-400',    iconColor: 'text-sky-400'    },
    stroke: { bg: 'bg-transparent',   border: 'border-sky-500/30',   text: 'text-sky-400',    iconColor: 'text-sky-400'    },
  },
  feature: {
    icon: 'ri-sparkling-2-line',
    filled: { bg: 'bg-purple-500/15', border: 'border-purple-500/30', text: 'text-purple-300', iconColor: 'text-purple-400' },
    light:  { bg: 'bg-purple-500/8',  border: 'border-purple-500/20', text: 'text-purple-400', iconColor: 'text-purple-400' },
    stroke: { bg: 'bg-transparent',   border: 'border-purple-500/30', text: 'text-purple-400', iconColor: 'text-purple-400' },
  },
}

interface AlertProps {
  status?:    AlertStatus
  variant?:   AlertVariant
  title?:     string
  icon?:      string        // override default icon
  onDismiss?: () => void    // renders ✕ button
  children?:  React.ReactNode
  className?: string
}

export function Alert({
  status = 'information',
  variant = 'light',
  title,
  icon,
  onDismiss,
  children,
  className,
}: AlertProps) {
  const cfg  = STATUS[status]
  const mode = cfg[variant]
  const ico  = icon ?? cfg.icon

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg border px-3.5 py-3 text-sm',
        mode.bg, mode.border, mode.text,
        className,
      )}
    >
      <i className={cn(ico, 'mt-px shrink-0 text-base leading-none', mode.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium mb-0.5">{title}</p>}
        {children && <p className={title ? 'opacity-80' : ''}>{children}</p>}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 text-current opacity-50 hover:opacity-80 transition-opacity"
          aria-label="Dismiss"
        >
          <i className="ri-close-line text-base leading-none" />
        </button>
      )}
    </div>
  )
}
