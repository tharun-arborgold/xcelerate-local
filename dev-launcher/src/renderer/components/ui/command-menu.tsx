import React from 'react'
import { Command } from 'cmdk'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent } from './dialog'

// ─── AlignUI CommandMenu ─────────────────────────────────────────────────────
//
// ⌘K command palette built on the `cmdk` library.
// Keyboard-navigable search interface for app-wide actions and navigation.
//
// Anatomy:
//   <CommandMenu open={open} onOpenChange={setOpen}>
//     <CommandInput placeholder="Search…" />
//     <CommandList>
//       <CommandEmpty>No results</CommandEmpty>
//       <CommandGroup heading="Actions">
//         <CommandItem onSelect={() => doSomething()}>
//           <i className="ri-add-line" />
//           New slot
//         </CommandItem>
//       </CommandGroup>
//       <CommandSeparator />
//       <CommandGroup heading="Navigation">
//         <CommandItem>Go to settings</CommandItem>
//       </CommandGroup>
//     </CommandList>
//   </CommandMenu>
//
// The palette opens inside a Dialog overlay so it's always centered.
// Trigger it externally with a ⌘K / Ctrl+K key handler:
//
//   useEffect(() => {
//     const handler = (e: KeyboardEvent) => {
//       if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
//         e.preventDefault()
//         setOpen(prev => !prev)
//       }
//     }
//     window.addEventListener('keydown', handler)
//     return () => window.removeEventListener('keydown', handler)
//   }, [])

// ── Wrapper (Dialog shell) ────────────────────────────────────────────────────

interface CommandMenuProps {
  open:           boolean
  onOpenChange:   (open: boolean) => void
  children:       React.ReactNode
}

export function CommandMenu({ open, onOpenChange, children }: CommandMenuProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="md"
        hideCloseBtn
        className="p-0 overflow-hidden"
        style={{ padding: 0 }}
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <Command
          className="flex flex-col rounded-xl overflow-hidden bg-neutral-900"
          shouldFilter={true}
        >
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────

interface CommandInputProps extends React.ComponentPropsWithoutRef<typeof Command.Input> {}

export function CommandInput({ className, ...props }: CommandInputProps) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 border-b border-neutral-800">
      <i className="ri-search-line text-base text-neutral-500 shrink-0" />
      <Command.Input
        className={cn(
          'flex-1 bg-transparent text-sm text-neutral-200 placeholder:text-neutral-500',
          'focus:outline-none',
          className,
        )}
        {...props}
      />
    </div>
  )
}

// ── List ──────────────────────────────────────────────────────────────────────

export function CommandList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Command.List className={cn('max-h-80 overflow-y-auto p-1.5', className)}>
      {children}
    </Command.List>
  )
}

// ── Empty ─────────────────────────────────────────────────────────────────────

export function CommandEmpty({ children = 'No results found.' }: { children?: React.ReactNode }) {
  return (
    <Command.Empty className="flex flex-col items-center justify-center py-8 text-sm text-neutral-500">
      {children}
    </Command.Empty>
  )
}

// ── Group ─────────────────────────────────────────────────────────────────────

interface CommandGroupProps extends React.ComponentPropsWithoutRef<typeof Command.Group> {}

export function CommandGroup({ heading, children, className, ...props }: CommandGroupProps) {
  return (
    <Command.Group
      heading={heading}
      className={cn(
        '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5',
        '[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold',
        '[&_[cmdk-group-heading]]:text-neutral-600 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider',
        className,
      )}
      {...props}
    >
      {children}
    </Command.Group>
  )
}

// ── Item ──────────────────────────────────────────────────────────────────────

interface CommandItemProps extends React.ComponentPropsWithoutRef<typeof Command.Item> {
  shortcut?: string   // e.g. "⌘K"
}

export function CommandItem({ shortcut, children, className, ...props }: CommandItemProps) {
  return (
    <Command.Item
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-300',
        'cursor-default select-none outline-none',
        'data-[selected=true]:bg-neutral-800 data-[selected=true]:text-neutral-100',
        'transition-colors duration-75',
        className,
      )}
      {...props}
    >
      <span className="flex-1 flex items-center gap-2.5">{children}</span>
      {shortcut && (
        <span className="text-[10px] font-mono text-neutral-600 shrink-0">{shortcut}</span>
      )}
    </Command.Item>
  )
}

// ── Separator ─────────────────────────────────────────────────────────────────

export function CommandSeparator({ className }: { className?: string }) {
  return <Command.Separator className={cn('my-1 h-px bg-neutral-800', className)} />
}

// ── Footer ────────────────────────────────────────────────────────────────────

export function CommandFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-2.5 border-t border-neutral-800',
      'text-[11px] text-neutral-600',
      className,
    )}>
      {children}
    </div>
  )
}
