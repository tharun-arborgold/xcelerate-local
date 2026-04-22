import React from 'react'
import { cn } from '@/lib/utils'

// ─── AlignUI Breadcrumb ──────────────────────────────────────────────────────
//
// Navigation path showing hierarchy: Home / Section / Current Page.
// The last item is the current page (non-clickable, full color).
// Separator is customizable (default: chevron ›).
//
// Usage:
//   <Breadcrumb>
//     <BreadcrumbItem href="/">Home</BreadcrumbItem>
//     <BreadcrumbItem href="/settings">Settings</BreadcrumbItem>
//     <BreadcrumbItem>Notifications</BreadcrumbItem>
//   </Breadcrumb>
//
//   Custom separator:
//   <Breadcrumb separator="/">
//     …
//   </Breadcrumb>

interface BreadcrumbProps {
  separator?: React.ReactNode   // default: › chevron icon
  children:   React.ReactNode
  className?: string
}

export function Breadcrumb({ separator, children, className }: BreadcrumbProps) {
  const items = React.Children.toArray(children).filter(React.isValidElement)
  const sep   = separator ?? <i className="ri-arrow-right-s-line text-xs leading-none text-neutral-600" />

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <ol className="flex items-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span className="select-none" aria-hidden="true">{sep}</span>}
            {React.cloneElement(item as React.ReactElement<BreadcrumbItemProps>, {
              _active: i === items.length - 1,
            })}
          </li>
        ))}
      </ol>
    </nav>
  )
}

interface BreadcrumbItemProps {
  href?:      string
  onClick?:   () => void
  _active?:   boolean   // injected by parent — last item is active
  children:   React.ReactNode
  className?: string
}

export function BreadcrumbItem({ href, onClick, _active, children, className }: BreadcrumbItemProps) {
  const base = cn(
    'text-xs font-medium transition-colors duration-150',
    _active
      ? 'text-neutral-200 pointer-events-none'
      : 'text-neutral-500 hover:text-neutral-300 cursor-pointer',
    className,
  )

  if (href && !_active) {
    return <a href={href} className={base}>{children}</a>
  }
  if (onClick && !_active) {
    return <button onClick={onClick} className={base}>{children}</button>
  }
  return (
    <span className={base} aria-current={_active ? 'page' : undefined}>
      {children}
    </span>
  )
}
