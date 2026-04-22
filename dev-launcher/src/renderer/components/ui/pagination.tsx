import React from 'react'
import { cn } from '@/lib/utils'

// ─── AlignUI Pagination ──────────────────────────────────────────────────────
//
// Page number controls with Prev/Next and ellipsis for large page counts.
//
// Variants:
//   basic   → numbered buttons + prev/next arrows  (default)
//   rounded → circular page buttons
//   group   → single pill with prev/next joined (minimal)
//
// Behavior:
//   Shows up to `siblings` pages on each side of the current page.
//   Pages beyond that collapse to "…".
//
// Usage:
//   const [page, setPage] = React.useState(1)
//   <Pagination page={page} totalPages={20} onPageChange={setPage} />
//
//   <Pagination
//     page={page}
//     totalPages={50}
//     siblings={2}
//     variant="rounded"
//     onPageChange={setPage}
//   />

type PaginationVariant = 'basic' | 'rounded' | 'group'

interface PaginationProps {
  page:           number
  totalPages:     number
  onPageChange:   (page: number) => void
  siblings?:      number           // pages to show on each side (default: 1)
  variant?:       PaginationVariant
  showEdges?:     boolean          // always show first/last page
  className?:     string
}

function buildRange(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

export function Pagination({
  page, totalPages, onPageChange, siblings = 1, variant = 'basic',
  showEdges = true, className,
}: PaginationProps) {
  const hasPrev = page > 1
  const hasNext = page < totalPages

  // Build page range with ellipsis
  const DOTS = -1
  function getPages(): (number | -1)[] {
    const total = 2 * siblings + 5 // 1 + ... + [siblings] + current + [siblings] + ... + last
    if (totalPages <= total) return buildRange(1, totalPages)

    const left  = Math.max(2, page - siblings)
    const right = Math.min(totalPages - 1, page + siblings)

    const showLeft  = left  > 2
    const showRight = right < totalPages - 1

    const pages: (number | -1)[] = [1]
    if (showLeft)  pages.push(DOTS)
    pages.push(...buildRange(left, right))
    if (showRight) pages.push(DOTS)
    pages.push(totalPages)
    return pages
  }

  const pages = getPages()

  const btnBase = cn(
    'inline-flex items-center justify-center text-sm font-medium transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40',
    'disabled:pointer-events-none disabled:opacity-40',
  )
  const shape   = variant === 'rounded' ? 'rounded-full' : 'rounded-lg'
  const size    = 'size-8'

  if (variant === 'group') {
    return (
      <div className={cn('inline-flex items-center rounded-lg border border-neutral-700 overflow-hidden', className)}>
        <button
          disabled={!hasPrev}
          onClick={() => onPageChange(page - 1)}
          className={cn(btnBase, 'px-3 h-8 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 border-r border-neutral-700')}
          aria-label="Previous page"
        >
          <i className="ri-arrow-left-s-line text-base leading-none" />
        </button>
        <span className="px-3 h-8 flex items-center text-xs text-neutral-400 tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          className={cn(btnBase, 'px-3 h-8 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 border-l border-neutral-700')}
          aria-label="Next page"
        >
          <i className="ri-arrow-right-s-line text-base leading-none" />
        </button>
      </div>
    )
  }

  return (
    <nav aria-label="Pagination" className={cn('flex items-center gap-1', className)}>
      <button
        disabled={!hasPrev}
        onClick={() => onPageChange(page - 1)}
        className={cn(btnBase, size, shape, 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200')}
        aria-label="Previous page"
      >
        <i className="ri-arrow-left-s-line text-base leading-none" />
      </button>

      {pages.map((p, i) =>
        p === DOTS ? (
          <span key={`dots-${i}`} className={cn('flex items-center justify-center text-neutral-600 text-sm', size)}>
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              btnBase, size, shape,
              p === page
                ? 'bg-purple-500 text-white'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200',
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        disabled={!hasNext}
        onClick={() => onPageChange(page + 1)}
        className={cn(btnBase, size, shape, 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200')}
        aria-label="Next page"
      >
        <i className="ri-arrow-right-s-line text-base leading-none" />
      </button>
    </nav>
  )
}
