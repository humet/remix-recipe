'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchStatusProps {
  total: number
  isSearching: boolean
  hasFilters: boolean
  partial: boolean
  unmatchedTerms: string[]
}

/** Result count, announced politely to screen readers as it changes. */
export function SearchStatus({ total, isSearching, hasFilters, partial, unmatchedTerms }: SearchStatusProps) {
  let text: string
  if (partial) {
    text =
      unmatchedTerms.length > 0
        ? `Nothing mentions ${quoteList(unmatchedTerms)}. Showing matches for the rest.`
        : 'No recipe has all of those. Showing the closest matches.'
  } else if (isSearching || hasFilters) {
    text = `${total} ${total === 1 ? 'match' : 'matches'}`
  } else {
    text = `${total} ${total === 1 ? 'recipe' : 'recipes'}`
  }

  return (
    <p aria-live="polite" className="text-xs text-muted-foreground px-1">
      {total > 0 ? text : ''}
    </p>
  )
}

interface NoResultsProps {
  query: string
  /** Matches that the tag/favourite filters are hiding. */
  hiddenByFilters: number
  onClearFilters: () => void
  onClearSearch: () => void
  /** Offer to remix something new — not in the picker, where it'd lose the user's place. */
  showRemix?: boolean
}

export function NoResults({ query, hiddenByFilters, onClearFilters, onClearSearch, showRemix = true }: NoResultsProps) {
  const trimmed = query.trim()

  if (hiddenByFilters > 0) {
    return (
      <div className="text-center py-10 px-6">
        <p className="font-medium text-foreground">No matches with these filters</p>
        <p className="text-sm text-muted-foreground mt-1">
          {hiddenByFilters} {hiddenByFilters === 1 ? 'recipe matches' : 'recipes match'}
          {trimmed ? ` “${trimmed}”` : ''} without them.
        </p>
        <Button variant="secondary" className="mt-4 h-11" onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    )
  }

  return (
    <div className="text-center py-10 px-6">
      <p className="font-medium text-foreground">
        {trimmed ? `No recipes match “${trimmed}”` : 'No recipes match'}
      </p>
      <p className="text-sm text-muted-foreground mt-1">Try one ingredient, or check the spelling.</p>
      <div className="flex flex-col items-center gap-2 mt-4">
        {showRemix && (
          <Button asChild className="h-11">
            <Link href="/">
              <Sparkles className="h-4 w-4" />
              Remix a new recipe
            </Link>
          </Button>
        )}
        {trimmed && (
          <Button variant="ghost" className="h-11" onClick={onClearSearch}>
            Clear search
          </Button>
        )}
      </div>
    </div>
  )
}

function quoteList(items: string[]): string {
  const q = items.map((t) => `“${t}”`)
  return q.length === 1 ? q[0] : `${q.slice(0, -1).join(', ')} or ${q[q.length - 1]}`
}
