import React from 'react'
import { cn } from '@/lib/utils'

// ─── AlignUI Avatar ──────────────────────────────────────────────────────────
//
// User avatar with image, initials fallback, and optional status indicator.
//
// Sizes (AlignUI range: 20–80px):
//   xs  → size-5  (20px)  — dense lists
//   sm  → size-7  (28px)  — compact rows
//   md  → size-8  (32px)  — default (nav, comments)
//   lg  → size-10 (40px)  — profile headers
//   xl  → size-14 (56px)  — hero/settings pages
//
// Colors for initials fallback (AlignUI palette):
//   gray, purple, blue, green, yellow, red, sky, pink, teal, orange
//
// Status indicator (bottom-right dot):
//   online → green   offline → neutral   busy → red   away → yellow
//
// Usage:
//   <Avatar src="/avatar.jpg" alt="Jane" />
//   <Avatar initials="JD" color="purple" size="lg" />
//   <Avatar initials="AB" status="online" />

type AvatarSize   = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type AvatarColor  = 'gray' | 'purple' | 'blue' | 'green' | 'yellow' | 'red' | 'sky' | 'pink' | 'teal' | 'orange'
type AvatarStatus = 'online' | 'offline' | 'busy' | 'away'

const SIZES: Record<AvatarSize, { box: string; text: string; dot: string }> = {
  xs: { box: 'size-5',  text: 'text-[9px]',   dot: 'size-1.5 -bottom-px -right-px' },
  sm: { box: 'size-7',  text: 'text-[11px]',  dot: 'size-2   bottom-px  right-px'  },
  md: { box: 'size-8',  text: 'text-xs',       dot: 'size-2   bottom-0   right-0'   },
  lg: { box: 'size-10', text: 'text-sm',        dot: 'size-2.5 bottom-0   right-0'   },
  xl: { box: 'size-14', text: 'text-base',      dot: 'size-3   bottom-0.5 right-0.5' },
}

const COLORS: Record<AvatarColor, string> = {
  gray:   'bg-neutral-700  text-neutral-200',
  purple: 'bg-purple-500/20 text-purple-300',
  blue:   'bg-blue-500/20   text-blue-300',
  green:  'bg-green-500/20  text-green-300',
  yellow: 'bg-yellow-500/20 text-yellow-300',
  red:    'bg-red-500/20    text-red-300',
  sky:    'bg-sky-500/20    text-sky-300',
  pink:   'bg-pink-500/20   text-pink-300',
  teal:   'bg-teal-500/20   text-teal-300',
  orange: 'bg-orange-500/20 text-orange-300',
}

const STATUS_DOT: Record<AvatarStatus, string> = {
  online:  'bg-green-500',
  offline: 'bg-neutral-500',
  busy:    'bg-red-500',
  away:    'bg-yellow-500',
}

interface AvatarProps {
  src?:       string
  alt?:       string
  initials?:  string       // shown when no src or img fails to load
  color?:     AvatarColor  // bg color for initials fallback
  size?:      AvatarSize
  status?:    AvatarStatus
  className?: string
}

export function Avatar({
  src, alt, initials, color = 'gray', size = 'md', status, className,
}: AvatarProps) {
  const [imgError, setImgError] = React.useState(false)
  const s = SIZES[size]

  return (
    <div className={cn('relative inline-flex shrink-0', s.box, className)}>
      {src && !imgError ? (
        <img
          src={src}
          alt={alt ?? ''}
          onError={() => setImgError(true)}
          className="size-full rounded-full object-cover"
        />
      ) : (
        <div className={cn(
          'size-full rounded-full flex items-center justify-center font-semibold uppercase select-none',
          s.text, COLORS[color],
        )}>
          {initials?.slice(0, 2) ?? alt?.slice(0, 2) ?? '?'}
        </div>
      )}

      {status && (
        <span className={cn(
          'absolute block rounded-full ring-2 ring-neutral-950',
          STATUS_DOT[status], s.dot,
        )} />
      )}
    </div>
  )
}
