import React from 'react'
import { cn } from '@/lib/utils'
import { Avatar } from './avatar'
import type { AvatarSize } from './avatar'

// ─── AlignUI AvatarGroup ─────────────────────────────────────────────────────
//
// Stacked row of overlapping avatars. Shows the first `max` avatars,
// then a "+N" overflow badge for the rest.
//
// Stacking: right-to-left overlap via negative margin + z-index.
// Each avatar gets a ring to separate it from neighbors.
//
// Usage:
//   <AvatarGroup
//     avatars={[
//       { src: '/a.jpg', alt: 'Alice' },
//       { initials: 'BK', color: 'purple' },
//       { initials: 'CJ', color: 'blue' },
//     ]}
//     max={3}
//     size="md"
//   />

export type { AvatarSize }

interface AvatarItem {
  src?:      string
  alt?:      string
  initials?: string
  color?:    'gray' | 'purple' | 'blue' | 'green' | 'yellow' | 'red' | 'sky' | 'pink' | 'teal' | 'orange'
}

interface AvatarGroupProps {
  avatars:    AvatarItem[]
  max?:       number        // max visible before "+N" (default: 4)
  size?:      AvatarSize
  className?: string
}

export function AvatarGroup({ avatars, max = 4, size = 'md', className }: AvatarGroupProps) {
  const visible  = avatars.slice(0, max)
  const overflow = avatars.length - max

  // Negative margin to overlap — amount scales with avatar size
  const OVERLAP: Record<string, string> = {
    xs: '-ml-1.5',
    sm: '-ml-2',
    md: '-ml-2.5',
    lg: '-ml-3',
    xl: '-ml-4',
  }

  const BOX: Record<string, string> = {
    xs: 'size-5',
    sm: 'size-7',
    md: 'size-8',
    lg: 'size-10',
    xl: 'size-14',
  }

  const TEXT: Record<string, string> = {
    xs: 'text-[8px]',
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm',
  }

  return (
    <div className={cn('flex items-center', className)}>
      {visible.map((av, i) => (
        <Avatar
          key={i}
          src={av.src}
          alt={av.alt}
          initials={av.initials}
          color={av.color}
          size={size}
          className={cn(
            'ring-2 ring-neutral-950',
            i > 0 && OVERLAP[size],
            'z-[' + (visible.length - i) + ']',
          )}
        />
      ))}

      {overflow > 0 && (
        <div className={cn(
          'inline-flex items-center justify-center rounded-full',
          'ring-2 ring-neutral-950',
          'bg-neutral-800 text-neutral-400 font-medium',
          OVERLAP[size], BOX[size], TEXT[size],
        )}>
          +{overflow}
        </div>
      )}
    </div>
  )
}
