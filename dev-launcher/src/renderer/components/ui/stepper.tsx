import React from 'react'
import { cn } from '@/lib/utils'

// ─── AlignUI Stepper ─────────────────────────────────────────────────────────
//
// Three variants for showing sequential progress through a multi-step flow.
//
// ── DotStepper ─────────────────────────────────────────────────────
// Minimal dots — for simple 3–5 step flows (onboarding, wizards).
//   <DotStepper steps={4} current={1} />
//
// ── HorizontalStepper ──────────────────────────────────────────────
// Numbered steps with labels and a connecting line.
//   <HorizontalStepper
//     steps={[
//       { label: 'Account', description: 'Email & password' },
//       { label: 'Profile' },
//       { label: 'Plan' },
//       { label: 'Confirm' },
//     ]}
//     current={1}
//   />
//
// ── VerticalStepper ────────────────────────────────────────────────
// Vertical list with content slots per step — for long forms / checkout flows.
//   <VerticalStepper
//     steps={[
//       { label: 'Create account', content: <AccountForm /> },
//       { label: 'Set up profile', content: <ProfileForm /> },
//     ]}
//     current={0}
//   />
//
// Step states: completed (step < current), active (step === current), pending (step > current)

// ── DotStepper ────────────────────────────────────────────────────────────────

interface DotStepperProps {
  steps:      number
  current:    number        // 0-indexed
  onStepClick?: (i: number) => void
  className?: string
}

export function DotStepper({ steps, current, onStepClick, className }: DotStepperProps) {
  return (
    <div className={cn('flex items-center gap-2', className)} role="tablist">
      {Array.from({ length: steps }, (_, i) => (
        <button
          key={i}
          role="tab"
          aria-selected={i === current}
          aria-label={`Step ${i + 1}`}
          onClick={() => onStepClick?.(i)}
          className={cn(
            'rounded-full transition-all duration-200',
            i === current
              ? 'w-5 h-2 bg-purple-500'
              : i < current
                ? 'size-2 bg-purple-500/50'
                : 'size-2 bg-neutral-700',
            onStepClick ? 'cursor-pointer hover:bg-purple-400' : 'cursor-default',
          )}
        />
      ))}
    </div>
  )
}

// ── HorizontalStepper ────────────────────────────────────────────────────────

interface StepDef {
  label:        string
  description?: string
  icon?:        string    // optional override for completed state
}

interface HorizontalStepperProps {
  steps:       StepDef[]
  current:     number     // 0-indexed active step
  className?:  string
}

export function HorizontalStepper({ steps, current, className }: HorizontalStepperProps) {
  return (
    <nav aria-label="Progress" className={cn('flex items-start', className)}>
      {steps.map((step, i) => {
        const completed = i < current
        const active    = i === current

        return (
          <React.Fragment key={i}>
            {/* Step */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              {/* Circle */}
              <div className={cn(
                'size-8 rounded-full flex items-center justify-center text-sm font-semibold',
                'ring-2 transition-colors duration-200',
                completed
                  ? 'bg-purple-500 ring-purple-500 text-white'
                  : active
                    ? 'bg-neutral-900 ring-purple-500 text-purple-400'
                    : 'bg-neutral-900 ring-neutral-700 text-neutral-600',
              )}>
                {completed
                  ? <i className="ri-check-line text-sm" />
                  : <span>{i + 1}</span>
                }
              </div>
              {/* Label */}
              <div className="flex flex-col items-center text-center min-w-0">
                <span className={cn(
                  'text-xs font-medium',
                  active ? 'text-neutral-200' : completed ? 'text-neutral-400' : 'text-neutral-600',
                )}>
                  {step.label}
                </span>
                {step.description && (
                  <span className="text-[10px] text-neutral-600 mt-0.5">{step.description}</span>
                )}
              </div>
            </div>

            {/* Connector line (between steps) */}
            {i < steps.length - 1 && (
              <div className={cn(
                'flex-1 h-px mt-4 mx-2 transition-colors duration-200',
                i < current ? 'bg-purple-500' : 'bg-neutral-800',
              )} />
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

// ── VerticalStepper ───────────────────────────────────────────────────────────

interface VerticalStepDef {
  label:        string
  description?: string
  content?:     React.ReactNode  // shown when step is active
}

interface VerticalStepperProps {
  steps:      VerticalStepDef[]
  current:    number
  className?: string
}

export function VerticalStepper({ steps, current, className }: VerticalStepperProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      {steps.map((step, i) => {
        const completed = i < current
        const active    = i === current
        const isLast    = i === steps.length - 1

        return (
          <div key={i} className="flex gap-4">
            {/* Left: circle + connector */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'size-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0',
                'ring-2 transition-colors duration-200',
                completed
                  ? 'bg-purple-500 ring-purple-500 text-white'
                  : active
                    ? 'bg-neutral-900 ring-purple-500 text-purple-400'
                    : 'bg-neutral-900 ring-neutral-700 text-neutral-600',
              )}>
                {completed ? <i className="ri-check-line text-sm" /> : <span>{i + 1}</span>}
              </div>
              {!isLast && (
                <div className={cn(
                  'w-px flex-1 my-2 transition-colors duration-200',
                  completed ? 'bg-purple-500/40' : 'bg-neutral-800',
                )} />
              )}
            </div>

            {/* Right: label + content */}
            <div className={cn('flex flex-col pb-6', isLast && 'pb-0')}>
              <div className="mt-1 mb-1">
                <p className={cn(
                  'text-sm font-medium',
                  active ? 'text-neutral-200' : completed ? 'text-neutral-400' : 'text-neutral-600',
                )}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-neutral-600 mt-0.5">{step.description}</p>
                )}
              </div>
              {active && step.content && (
                <div className="mt-3">{step.content}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
