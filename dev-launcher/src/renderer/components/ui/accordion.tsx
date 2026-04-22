import React from 'react'
import * as Radix from '@radix-ui/react-accordion'
import { cn } from '@/lib/utils'

// ─── AlignUI Accordion ───────────────────────────────────────────────────────
//
// Collapsible content sections built on Radix Accordion.
// Content expands/collapses with a smooth height animation.
//
// Type:
//   single   — only one item open at a time (default)
//   multiple — multiple items can be open simultaneously
//
// Variants:
//   default  → each item has a bottom border (list style)
//   card     → each item is a standalone card with rounded border
//
// Usage (single):
//   <Accordion type="single" collapsible>
//     <AccordionItem value="item-1">
//       <AccordionTrigger>What is Xcelerate?</AccordionTrigger>
//       <AccordionContent>An enterprise SaaS platform…</AccordionContent>
//     </AccordionItem>
//   </Accordion>
//
// Usage (multiple, card variant):
//   <Accordion type="multiple" variant="card">
//     <AccordionItem value="config">
//       <AccordionTrigger icon="ri-settings-line">Configuration</AccordionTrigger>
//       <AccordionContent>…</AccordionContent>
//     </AccordionItem>
//   </Accordion>

// ── Root ──────────────────────────────────────────────────────────────────────

interface AccordionProps {
  type?:      'single' | 'multiple'
  variant?:   'default' | 'card'
  collapsible?: boolean
  value?:     string | string[]
  defaultValue?: string | string[]
  onValueChange?: (value: any) => void
  children:   React.ReactNode
  className?: string
}

export function Accordion({ type = 'single', variant = 'default', collapsible = true, className, children, ...props }: AccordionProps) {
  const Root = Radix.Root as any
  return (
    <Root
      type={type}
      collapsible={type === 'single' ? collapsible : undefined}
      className={cn(
        variant === 'card' ? 'flex flex-col gap-2' : 'flex flex-col',
        className,
      )}
      {...props}
    >
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, { _variant: variant })
          : child
      )}
    </Root>
  )
}

// ── Item ──────────────────────────────────────────────────────────────────────

interface AccordionItemProps extends React.ComponentPropsWithoutRef<typeof Radix.Item> {
  _variant?: 'default' | 'card'
}

export function AccordionItem({ _variant = 'default', className, ...props }: AccordionItemProps) {
  return (
    <Radix.Item
      className={cn(
        _variant === 'card'
          ? 'rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden'
          : 'border-b border-neutral-800 last:border-0',
        className,
      )}
      {...props}
    />
  )
}

// ── Trigger ───────────────────────────────────────────────────────────────────

interface AccordionTriggerProps extends React.ComponentPropsWithoutRef<typeof Radix.Trigger> {
  icon?: string   // optional Remix Icon class prepended to the label
}

export function AccordionTrigger({ icon, children, className, ...props }: AccordionTriggerProps) {
  return (
    <Radix.Header className="flex">
      <Radix.Trigger
        className={cn(
          'flex flex-1 items-center gap-2.5 px-4 py-3 text-sm font-medium text-neutral-200',
          'transition-colors duration-150 hover:text-neutral-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-500/40',
          '[&[data-state=open]>i.chevron]:rotate-180',
          className,
        )}
        {...props}
      >
        {icon && <i className={cn(icon, 'text-base text-neutral-500 shrink-0')} />}
        <span className="flex-1 text-left">{children}</span>
        <i className="chevron ri-arrow-down-s-line text-base text-neutral-500 shrink-0 transition-transform duration-200" />
      </Radix.Trigger>
    </Radix.Header>
  )
}

// ── Content ───────────────────────────────────────────────────────────────────

export function AccordionContent({ children, className, ...props }: React.ComponentPropsWithoutRef<typeof Radix.Content>) {
  return (
    <Radix.Content
      className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up"
      {...props}
    >
      <div className={cn('px-4 pb-4 text-sm text-neutral-400 leading-relaxed', className)}>
        {children}
      </div>
    </Radix.Content>
  )
}
