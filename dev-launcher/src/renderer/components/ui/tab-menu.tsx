import React, { useRef, useState, useEffect, useCallback } from 'react'
import * as RadixTabs from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

// ─── AlignUI TabMenu ─────────────────────────────────────────────────────────
//
// Animated tab navigation built on Radix Tabs.
// Uses a ResizeObserver-driven floating indicator (same technique as SegmentedControl).
//
// Orientations:
//   horizontal (default) — left-to-right tabs, bottom border indicator
//   vertical             — top-to-bottom tabs, right border indicator
//
// Variants:
//   line     — just the animated underline (default); transparent bg
//   contained — tabs inside a pill/card container (like SegmentedControl)
//
// Usage:
//   <TabMenu value={tab} onValueChange={setTab}>
//     <TabMenuItem value="overview">Overview</TabMenuItem>
//     <TabMenuItem value="activity" icon="ri-history-line">Activity</TabMenuItem>
//     <TabMenuItem value="settings">Settings</TabMenuItem>
//   </TabMenu>
//   <TabContent value="overview">…content…</TabContent>
//
// Full compound usage:
//   <Tabs defaultValue="overview">
//     <TabMenu>
//       <TabMenuItem value="overview">Overview</TabMenuItem>
//       <TabMenuItem value="settings">Settings</TabMenuItem>
//     </TabMenu>
//     <RadixTabs.Content value="overview">…</RadixTabs.Content>
//   </Tabs>

// Re-export Radix primitives for full compound usage
export const Tabs        = RadixTabs.Root
export const TabContent  = RadixTabs.Content

// ── TabMenu (list + animated indicator) ──────────────────────────────────────

interface TabMenuProps extends React.ComponentPropsWithoutRef<typeof RadixTabs.List> {
  orientation?: 'horizontal' | 'vertical'
  variant?:     'line' | 'contained'
}

export function TabMenu({ orientation = 'horizontal', variant = 'line', className, children, ...props }: TabMenuProps) {
  const listRef  = useRef<HTMLDivElement>(null)
  const [ind, setInd] = useState({ left: 0, top: 0, width: 0, height: 0 })

  const measure = useCallback(() => {
    const list   = listRef.current
    const active = list?.querySelector<HTMLElement>('[data-state="active"]')
    if (!list || !active) return
    const lr = list.getBoundingClientRect()
    const ar = active.getBoundingClientRect()
    setInd({
      left:   ar.left - lr.left,
      top:    ar.top  - lr.top,
      width:  ar.width,
      height: ar.height,
    })
  }, [])

  useEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (listRef.current) ro.observe(listRef.current)
    return () => ro.disconnect()
  }, [measure])

  // Re-measure when active item changes (Radix fires data-state attribute changes)
  useEffect(() => {
    const mo = new MutationObserver(measure)
    if (listRef.current)
      mo.observe(listRef.current, { attributes: true, subtree: true, attributeFilter: ['data-state'] })
    return () => mo.disconnect()
  }, [measure])

  return (
    <RadixTabs.List
      ref={listRef}
      className={cn(
        'relative flex',
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        variant === 'contained'
          ? 'gap-0.5 rounded-lg bg-neutral-800/60 p-1'
          : orientation === 'horizontal'
            ? 'border-b border-neutral-800 gap-0'
            : 'border-r border-neutral-800 gap-0',
        className,
      )}
      {...props}
    >
      {children}

      {/* Animated indicator */}
      {ind.width > 0 && (
        variant === 'contained' ? (
          // Contained: floating bg pill
          <span
            className="absolute rounded-md bg-neutral-700 transition-all duration-150 ease-out pointer-events-none -z-10"
            style={{ left: ind.left, top: ind.top, width: ind.width, height: ind.height }}
          />
        ) : orientation === 'horizontal' ? (
          // Line: bottom border
          <span
            className="absolute bottom-0 h-0.5 rounded-full bg-purple-500 transition-all duration-150 ease-out pointer-events-none"
            style={{ left: ind.left, width: ind.width }}
          />
        ) : (
          // Line vertical: right border
          <span
            className="absolute right-0 w-0.5 rounded-full bg-purple-500 transition-all duration-150 ease-out pointer-events-none"
            style={{ top: ind.top, height: ind.height }}
          />
        )
      )}
    </RadixTabs.List>
  )
}

// ── TabMenuItem ───────────────────────────────────────────────────────────────

interface TabMenuItemProps extends React.ComponentPropsWithoutRef<typeof RadixTabs.Trigger> {
  icon?: string
}

export function TabMenuItem({ icon, children, className, ...props }: TabMenuItemProps) {
  return (
    <RadixTabs.Trigger
      className={cn(
        'relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium',
        'text-neutral-500 transition-colors duration-150',
        'hover:text-neutral-300',
        'data-[state=active]:text-neutral-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-500/40',
        'disabled:pointer-events-none disabled:opacity-40',
        'whitespace-nowrap',
        className,
      )}
      {...props}
    >
      {icon && <i className={cn(icon, 'text-base leading-none')} />}
      {children}
    </RadixTabs.Trigger>
  )
}
