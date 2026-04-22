import React from 'react'
import * as RadixDialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

// ─── AlignUI Dialog / Modal ──────────────────────────────────────────────────
//
// Centered modal overlay built on Radix Dialog for full a11y.
//
// Size:
//   sm  → max-w-sm  (384px)  — simple confirmations, small forms
//   md  → max-w-md  (448px)  — default, most modals
//   lg  → max-w-lg  (512px)  — larger forms, detail views
//   xl  → max-w-2xl (672px)  — rich content, tables
//
// Design:
//   Overlay  → bg-neutral-950/80  backdrop-blur-sm
//   Content  → bg-neutral-900  border border-neutral-800  rounded-xl  shadow-2xl
//   Animation: zoom-in-95 fade-in on open, reverse on close
//
// Compound components:
//   <Dialog>             → root (controls open state)
//   <DialogTrigger>      → element that opens the dialog
//   <DialogContent>      → the modal panel (handles overlay + positioning)
//   <DialogHeader>       → top section: title + description
//   <DialogFooter>       → bottom section: action buttons
//   <DialogTitle>        → bold heading (Radix a11y requirement)
//   <DialogDescription>  → sub-text below title
//   <DialogClose>        → element that closes (wraps buttons)
//
// Usage:
//   <Dialog>
//     <DialogTrigger asChild>
//       <Button>Delete slot</Button>
//     </DialogTrigger>
//     <DialogContent size="sm">
//       <DialogHeader>
//         <DialogTitle>Delete slot-a?</DialogTitle>
//         <DialogDescription>This action cannot be undone.</DialogDescription>
//       </DialogHeader>
//       <DialogFooter>
//         <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
//         <Button variant="danger" onClick={handleDelete}>Delete</Button>
//       </DialogFooter>
//     </DialogContent>
//   </Dialog>

export const Dialog        = RadixDialog.Root
export const DialogTrigger = RadixDialog.Trigger
export const DialogClose   = RadixDialog.Close

// ── Content (overlay + panel) ─────────────────────────────────────────────────

type DialogSize = 'sm' | 'md' | 'lg' | 'xl'
const SIZE_MAP: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof RadixDialog.Content> {
  size?:         DialogSize
  hideCloseBtn?: boolean
}

export function DialogContent({ size = 'md', hideCloseBtn, children, className, ...props }: DialogContentProps) {
  return (
    <RadixDialog.Portal>
      {/* Overlay */}
      <RadixDialog.Overlay
        className={cn(
          'fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm',
          'data-[state=open]:animate-in   data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        )}
      />
      {/* Panel */}
      <RadixDialog.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 px-4',
          'data-[state=open]:animate-in   data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          className,
        )}
        {...props}
      >
        <div className={cn(
          'relative rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl',
          SIZE_MAP[size], 'mx-auto',
        )}>
          {!hideCloseBtn && (
            <RadixDialog.Close
              className={cn(
                'absolute right-3 top-3 z-10',
                'rounded-lg p-1 text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800',
                'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40',
              )}
              aria-label="Close"
            >
              <i className="ri-close-line text-base leading-none" />
            </RadixDialog.Close>
          )}
          {children}
        </div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  )
}

// ── Header / Footer ───────────────────────────────────────────────────────────

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-5 pt-5 pb-4', className)}>{children}</div>
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'flex items-center justify-end gap-2 px-5 pb-5 pt-0',
      className,
    )}>
      {children}
    </div>
  )
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <RadixDialog.Title className={cn('text-sm font-semibold text-neutral-100 leading-snug', className)}>
      {children}
    </RadixDialog.Title>
  )
}

export function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <RadixDialog.Description className={cn('mt-1 text-sm text-neutral-500 leading-relaxed', className)}>
      {children}
    </RadixDialog.Description>
  )
}
