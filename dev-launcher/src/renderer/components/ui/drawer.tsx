import React from 'react'
import * as RadixDialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

// ─── AlignUI Drawer ──────────────────────────────────────────────────────────
//
// Slide-in panel from the edge of the screen. Built on Radix Dialog
// (same a11y guarantees: focus trap, scroll lock, Escape to close).
//
// Sides:
//   right  (default) — detail panels, settings, filters
//   left             — navigation sidebars
//   bottom           — mobile-style sheets, action pickers
//
// Widths (right/left):
//   sm  → max-w-xs   (320px)
//   md  → max-w-sm   (384px)  default
//   lg  → max-w-md   (448px)
//   xl  → max-w-lg   (512px)
//
// Anatomy:
//   <Drawer>
//     <DrawerTrigger asChild><Button>Open settings</Button></DrawerTrigger>
//     <DrawerContent>
//       <DrawerHeader>
//         <DrawerTitle>Settings</DrawerTitle>
//         <DrawerDescription>Adjust your preferences</DrawerDescription>
//       </DrawerHeader>
//       <DrawerBody>…scrollable content…</DrawerBody>
//       <DrawerFooter>
//         <DrawerClose asChild><Button>Cancel</Button></DrawerClose>
//         <Button variant="primary">Save</Button>
//       </DrawerFooter>
//     </DrawerContent>
//   </Drawer>

export const Drawer        = RadixDialog.Root
export const DrawerTrigger = RadixDialog.Trigger
export const DrawerClose   = RadixDialog.Close

type DrawerSide  = 'right' | 'left' | 'bottom'
type DrawerWidth = 'sm' | 'md' | 'lg' | 'xl'

const SIDE_CLASSES: Record<DrawerSide, string> = {
  right:  'inset-y-0 right-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
  left:   'inset-y-0 left-0  data-[state=closed]:slide-out-to-left  data-[state=open]:slide-in-from-left',
  bottom: 'inset-x-0 bottom-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
}

const WIDTH_CLASSES: Record<DrawerWidth, string> = {
  sm: 'w-full max-w-xs',
  md: 'w-full max-w-sm',
  lg: 'w-full max-w-md',
  xl: 'w-full max-w-lg',
}

interface DrawerContentProps extends React.ComponentPropsWithoutRef<typeof RadixDialog.Content> {
  side?:  DrawerSide
  width?: DrawerWidth
}

export function DrawerContent({ side = 'right', width = 'md', children, className, ...props }: DrawerContentProps) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay
        className={cn(
          'fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm',
          'data-[state=open]:animate-in   data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        )}
      />
      <RadixDialog.Content
        className={cn(
          'fixed z-50 flex flex-col',
          'border-neutral-800 bg-neutral-900 shadow-2xl',
          'data-[state=open]:animate-in   data-[state=closed]:animate-out',
          'data-[state=closed]:duration-200 data-[state=open]:duration-300',
          SIDE_CLASSES[side],
          side === 'bottom'
            ? 'border-t max-h-[85vh] rounded-t-xl'
            : cn('border-l', side === 'left' && 'border-l-0 border-r', WIDTH_CLASSES[width], 'h-full'),
          className,
        )}
        {...props}
      >
        {/* Close button */}
        <RadixDialog.Close
          className={cn(
            'absolute right-4 top-4 z-10',
            'rounded-lg p-1 text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40',
          )}
          aria-label="Close drawer"
        >
          <i className="ri-close-line text-base leading-none" />
        </RadixDialog.Close>

        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

export function DrawerHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-5 pt-5 pb-4 pr-10 border-b border-neutral-800 shrink-0', className)}>{children}</div>
}

export function DrawerTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <RadixDialog.Title className={cn('text-sm font-semibold text-neutral-100', className)}>
      {children}
    </RadixDialog.Title>
  )
}

export function DrawerDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <RadixDialog.Description className={cn('mt-1 text-xs text-neutral-500', className)}>
      {children}
    </RadixDialog.Description>
  )
}

export function DrawerBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex-1 overflow-y-auto px-5 py-4', className)}>{children}</div>
}

export function DrawerFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-end gap-2 px-5 py-4 border-t border-neutral-800 shrink-0', className)}>
      {children}
    </div>
  )
}
