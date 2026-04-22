import React from 'react'
import * as Radix from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

// AlignUI-aligned dropdown menu — dark, compact, used for overflow actions.

export const DropdownMenu      = Radix.Root
export const DropdownMenuTrigger = Radix.Trigger

interface ItemProps {
  icon?:      string
  label:      string
  danger?:    boolean
  disabled?:  boolean
  onSelect:   () => void
}

export function DropdownMenuItem({ icon, label, danger, disabled, onSelect }: ItemProps) {
  return (
    <Radix.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 text-sm rounded-md outline-none cursor-default select-none',
        'transition-colors duration-100',
        danger
          ? 'text-red-400 data-[highlighted]:bg-red-500/10 data-[highlighted]:text-red-300'
          : 'text-neutral-300 data-[highlighted]:bg-neutral-700 data-[highlighted]:text-neutral-100',
        disabled && 'opacity-40 pointer-events-none',
      )}
    >
      {icon && <i className={cn(icon, 'text-sm leading-none shrink-0')} />}
      {label}
    </Radix.Item>
  )
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  side?:  'top' | 'bottom' | 'left' | 'right'
}

export function DropdownMenuContent({ children, align = 'end', side = 'bottom' }: DropdownMenuContentProps) {
  return (
    <Radix.Portal>
      <Radix.Content
        align={align}
        side={side}
        sideOffset={4}
        className={cn(
          'z-50 min-w-[140px] rounded-lg border border-neutral-700 bg-neutral-800 p-1 shadow-md',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
        )}
      >
        {children}
      </Radix.Content>
    </Radix.Portal>
  )
}
