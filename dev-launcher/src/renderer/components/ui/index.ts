// ─── AlignUI Local Component Library ─────────────────────────────────────────
//
// Full AlignUI component set — copy-paste, dark-first, Radix-powered.
//
// Design principles (applied consistently across every component):
//
//   1. DARK-FIRST
//      All tokens are dark-mode values. No light/dark switching needed.
//      bg-neutral-950 (app) → bg-neutral-900 (cards) → bg-neutral-800 (elevated)
//
//   2. PURPLE PRIMARY
//      Interactive states: focus rings, checked, active indicators → purple-500.
//      Danger/destructive → red-500. Positive → green-500.
//
//   3. COMPACT DENSITY
//      Sizes: xs=h-7(28px) sm=h-8(32px) md=h-9(36px) lg → match row heights.
//      All row-level buttons use size="sm" to align with icon buttons (size-7).
//
//   4. RADIX PRIMITIVES
//      Keyboard nav, focus management, screen-reader roles — delegated to Radix.
//      Never re-implement what Radix provides.
//
//   5. CVA VARIANTS
//      class-variance-authority for type-safe variant × size combinations.
//      Use cn() from @/lib/utils for conditional/merged class strings.
//
//   6. COPY-PASTE ARCHITECTURE
//      Components own their styles. No theme provider dependency.
//      Move any component to another project by copying its file + globals.css.
//
// Import from this barrel:
//   import { Button, Input, Switch, Dialog } from '@/components/ui'

// ── Actions ───────────────────────────────────────────────────────────────────
export { Button, buttonVariants }                     from './button'
export type { ButtonProps }                           from './button'
export { ButtonGroup }                                from './button-group'
export { FancyButton }                                from './fancy-button'
export { LinkButton }                                 from './link-button'

// ── Data display ──────────────────────────────────────────────────────────────
export { Badge }                                      from './badge'
export { Avatar }                                     from './avatar'
export type { AvatarSize }                            from './avatar'
export { AvatarGroup }                                from './avatar-group'
export { StatusDot }                                  from './status-dot'
export type { StatusVariant }                         from './status-dot'
export { StatusBadge }                                from './status-badge'
export { Tag }                                        from './tag'
export { Kbd }                                        from './kbd'
export { ProgressBar }                                from './progress-bar'
export { ProgressCircle }                             from './progress-circle'

// ── Feedback ─────────────────────────────────────────────────────────────────
export { Alert }                                      from './alert'
export { Banner }                                     from './banner'
export { Spinner }                                    from './spinner'
export { Tooltip, TooltipProvider }                   from './tooltip'

// ── Form elements ─────────────────────────────────────────────────────────────
export { Label }                                      from './label'
export { Hint }                                       from './hint'
export { Input }                                      from './input'
export { Textarea }                                   from './textarea'
export { Select }                                     from './select'
export { Switch }                                     from './switch'
export { Checkbox }                                   from './checkbox'
export { RadioGroup, RadioItem }                      from './radio-group'
export { Slider }                                     from './slider'
export { DigitInput }                                 from './digit-input'
export { FileUpload }                                 from './file-upload'

// ── Layout ───────────────────────────────────────────────────────────────────
export { Separator }                                  from './separator'
export { ScrollArea }                                 from './scroll-area'
export { SegmentedControl }                           from './segmented-control'
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion'
export { Tabs, TabMenu, TabMenuItem, TabContent }     from './tab-menu'
export { Breadcrumb, BreadcrumbItem }                 from './breadcrumb'
export { Pagination }                                 from './pagination'

// ── Overlays ──────────────────────────────────────────────────────────────────
export {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
}                                                     from './dropdown-menu'
export {
  Dialog, DialogTrigger, DialogClose,
  DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription,
}                                                     from './dialog'
export {
  Popover, PopoverTrigger, PopoverClose, PopoverAnchor,
  PopoverContent, PopoverHeader, PopoverBody, PopoverFooter,
}                                                     from './popover'
export {
  Drawer, DrawerTrigger, DrawerClose,
  DrawerContent, DrawerHeader, DrawerBody, DrawerFooter,
  DrawerTitle, DrawerDescription,
}                                                     from './drawer'
export {
  CommandMenu, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator, CommandFooter,
}                                                     from './command-menu'

// ── Navigation ───────────────────────────────────────────────────────────────
export { DotStepper, HorizontalStepper, VerticalStepper } from './stepper'
