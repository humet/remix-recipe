'use client'

import { useEffect, useRef } from 'react'
import { Heart, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TagFacet } from '@/hooks/use-recipe-filter'

interface FilterChipsProps {
  facets: TagFacet[]
  onToggleTag: (tag: string) => void
  favouritesOnly: boolean
  favouriteCount: number
  onToggleFavourites: () => void
  hasFilters: boolean
  onClear: () => void
  className?: string
}

/**
 * One scrolling row, always visible — including while typing — so filters can
 * narrow a search. Applied chips lead the row; counts are what a tap would leave.
 */
export function FilterChips({
  facets,
  onToggleTag,
  favouritesOnly,
  favouriteCount,
  onToggleFavourites,
  hasFilters,
  onClear,
  className,
}: FilterChipsProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const appliedKey = [favouritesOnly, ...facets.filter((f) => f.active).map((f) => f.tag)].join('|')

  // Applied chips move to the front; bring the row back so the user sees what they applied.
  useEffect(() => {
    rowRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
  }, [appliedKey])

  const showFavourites = favouritesOnly || favouriteCount > 0
  if (!showFavourites && facets.length === 0 && !hasFilters) return null

  return (
    <div
      ref={rowRef}
      className={cn('flex gap-2 overflow-x-auto no-scrollbar px-5 py-1', className)}
      role="group"
      aria-label="Filters"
    >
      {hasFilters && (
        <Chip onClick={onClear} aria-label="Clear filters">
          <X className="h-4 w-4" />
          Clear
        </Chip>
      )}
      {showFavourites && (
        <Chip active={favouritesOnly} onClick={onToggleFavourites} aria-pressed={favouritesOnly}>
          <Heart className={cn('h-4 w-4', favouritesOnly && 'fill-current')} />
          Favourites
          <Count active={favouritesOnly}>{favouriteCount}</Count>
        </Chip>
      )}
      {facets.map((f) => (
        <Chip key={f.tag} active={f.active} onClick={() => onToggleTag(f.tag)} aria-pressed={f.active}>
          {f.tag}
          <Count active={f.active}>{f.count}</Count>
        </Chip>
      ))}
    </div>
  )
}

function Chip({
  active,
  className,
  children,
  ...props
}: React.ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        // 36px visual, 44px tap target via the pseudo-element.
        'relative shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
        "before:absolute before:-inset-y-1 before:inset-x-0 before:content-['']",
        active ? 'bg-primary text-primary-foreground' : 'glass-subtle text-foreground hover:bg-accent',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function Count({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <span className={cn('tabular-nums', active ? 'opacity-80' : 'text-muted-foreground')}>{children}</span>
}
