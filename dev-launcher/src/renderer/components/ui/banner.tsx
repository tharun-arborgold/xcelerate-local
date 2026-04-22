import React from 'react'
import { cn } from '@/lib/utils'

// ─── AlignUI Banner ──────────────────────────────────────────────────────────
//
// Full-width page-level status strip. Sits at the top of a page or section.
// More prominent than Alert (which is inline). Used for maintenance notices,
// feature announcements, and global system states.
//
// Variants (visual weight) — same as Alert:
//   filled  → solid tinted bg + border  — high emphasis
//   light   → faint bg + border          — medium (default)
//   stroke  → transparent bg + border   — low emphasis
//
// Statuses: error | warning | success | information | feature
//
// Optional action button (right side) and dismiss (×).
//
// Usage:
//   <Banner status="warning">Scheduled maintenance at 2 AM UTC</Banner>
//
//   <Banner
//     status="feature"
//     title="New: Multi-slot support"
//     action={{ label: 'Learn more', onClick: () => {} }}
//     onDismiss={() => {}}
//   >
//     Manage multiple dev environments simultaneously.
//   </Banner>

type BannerStatus  = 'error' | 'warning' | 'success' | 'information' | 'feature'
type BannerVariant = 'filled' | 'light' | 'stroke'

interface BannerConfig {
  icon:   string
  filled: { bg: string; border: string; text: string; iconColor: string }
  light:  { bg: string; border: string; text: string; iconColor: string }
  stroke: { bg: string; border: string; text: string; iconColor: string }
}

const STATUS: Record<BannerStatus, BannerConfig> = {
  error: {
    icon: 'ri-error-warning-line',
    filled: { bg: 'bg-red-500/15',    border: 'border-red-500/30',    text: 'text-red-300',    iconColor: 'text-red-400'    },
    light:  { bg: 'bg-red-500/8',     border: 'border-red-500/20',    text: 'text-red-400',    iconColor: 'text-red-400'    },
    stroke: { bg: 'bg-transparent',   border: 'border-red-500/30',    text: 'text-red-400',    iconColor: 'text-red-400'    },
  },
  warning: {
    icon: 'ri-alert-line',
    filled: { bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', text: 'text-yellow-300', iconColor: 'text-yellow-400' },
    light:  { bg: 'bg-yellow-500/8',  border: 'border-yellow-500/20', text: 'text-yellow-400', iconColor: 'text-yellow-400' },
    stroke: { bg: 'bg-transparent',   border: 'border-yellow-500/30', text: 'text-yellow-400', iconColor: 'text-yellow-400' },
  },
  success: {
    icon: 'ri-checkbox-circle-line',
    filled: { bg: 'bg-green-500/15',  border: 'border-green-500/30',  text: 'text-green-300',  iconColor: 'text-green-400'  },
    light:  { bg: 'bg-green-500/8',   border: 'border-green-500/20',  text: 'text-green-400',  iconColor: 'text-green-400'  },
    stroke: { bg: 'bg-transparent',   border: 'border-green-500/30',  text: 'text-green-400',  iconColor: 'text-green-400'  },
  },
  information: {
    icon: 'ri-information-line',
    filled: { bg: 'bg-sky-500/15',    border: 'border-sky-500/30',    text: 'text-sky-300',    iconColor: 'text-sky-400'    },
    light:  { bg: 'bg-sky-500/8',     border: 'border-sky-500/20',    text: 'text-sky-400',    iconColor: 'text-sky-400'    },
    stroke: { bg: 'bg-transparent',   border: 'border-sky-500/30',    text: 'text-sky-400',    iconColor: 'text-sky-400'    },
  },
  feature: {
    icon: 'ri-sparkling-2-line',
    filled: { bg: 'bg-purple-500/15', border: 'border-purple-500/30', text: 'text-purple-300', iconColor: 'text-purple-400' },
    light:  { bg: 'bg-purple-500/8',  border: 'border-purple-500/20', text: 'text-purple-400', iconColor: 'text-purple-400' },
    stroke: { bg: 'bg-transparent',   border: 'border-purple-500/30', text: 'text-purple-400', iconColor: 'text-purple-400' },
  },
}

interface BannerProps {
  status?:    BannerStatus
  variant?:   BannerVariant
  title?:     string
  icon?:      string
  action?:    { label: string; onClick: () => void }
  onDismiss?: () => void
  children?:  React.ReactNode
  className?: string
}

export function Banner({
  status = 'information', variant = 'light', title, icon, action, onDismiss, children, className,
}: BannerProps) {
  const cfg  = STATUS[status]
  const mode = cfg[variant]
  const ico  = icon ?? cfg.icon

  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-3 px-4 py-3 text-sm border-b',
        mode.bg, mode.border, mode.text,
        className,
      )}
    >
      <i className={cn(ico, 'shrink-0 text-base leading-none', mode.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <span className="font-semibold mr-1.5">{title}</span>}
        {children}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="shrink-0 text-xs font-semibold underline underline-offset-2 hover:no-underline transition-all"
        >
          {action.label}
        </button>
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 opacity-50 hover:opacity-80 transition-opacity"
          aria-label="Dismiss"
        >
          <i className="ri-close-line text-base leading-none" />
        </button>
      )}
    </div>
  )
}
