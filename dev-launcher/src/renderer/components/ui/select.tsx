import React from 'react'
import * as RadixSelect from '@radix-ui/react-select'
import { cn } from '@/lib/utils'

// AlignUI-faithful Select built on Radix UI.
// Replaces the native <select> so rendering is consistent across OS.

export interface SelectOption {
  value: string
  label: string
}

export interface SelectGroup {
  label: string
  options: SelectOption[]
}

interface SelectProps {
  value:     string
  groups:    SelectGroup[]
  disabled?: boolean
  onChange:  (value: string) => void
  className?: string
}

export function Select({ value, groups, disabled, onChange, className }: SelectProps) {
  return (
    <RadixSelect.Root value={value} onValueChange={onChange} disabled={disabled}>
      <RadixSelect.Trigger
        className={cn(
          'inline-flex items-center justify-between gap-1.5 rounded-lg',
          'border border-neutral-700 bg-neutral-800 text-neutral-400',
          'px-2.5 py-1 text-xs font-medium',
          'hover:border-neutral-600 hover:text-neutral-300',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'transition-colors min-w-[80px]',
          className,
        )}
      >
        <RadixSelect.Value />
        <RadixSelect.Icon>
          <i className="ri-arrow-down-s-line text-sm text-neutral-600" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className={cn(
            'z-50 min-w-[140px] overflow-hidden rounded-xl',
            'border border-neutral-700 bg-neutral-900 shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
        >
          <RadixSelect.Viewport className="p-1">
            {groups.map((group, gi) => (
              <React.Fragment key={group.label}>
                {gi > 0 && <RadixSelect.Separator className="my-1 h-px bg-neutral-800" />}
                <RadixSelect.Group>
                  <RadixSelect.Label className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">
                    {group.label}
                  </RadixSelect.Label>
                  {group.options.map(opt => (
                    <RadixSelect.Item
                      key={opt.value}
                      value={opt.value}
                      className={cn(
                        'relative flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-neutral-400',
                        'cursor-pointer select-none outline-none',
                        'data-[highlighted]:bg-neutral-800 data-[highlighted]:text-neutral-200',
                        'data-[state=checked]:text-purple-300',
                      )}
                    >
                      <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                      <RadixSelect.ItemIndicator className="ml-auto">
                        <i className="ri-check-line text-xs text-purple-400" />
                      </RadixSelect.ItemIndicator>
                    </RadixSelect.Item>
                  ))}
                </RadixSelect.Group>
              </React.Fragment>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}
