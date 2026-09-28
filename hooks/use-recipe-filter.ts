import { useMemo, useState } from 'react'
import {
  buildIndex,
  searchRecipes,
  type SearchableRecipe,
  type SearchResult,
} from '@/lib/search/recipe-search'

interface UseRecipeFilterOptions<T extends SearchableRecipe> {
  recipes: T[]
  initialQuery?: string
  initialTags?: string[]
  initialFavouritesOnly?: boolean
}

export interface TagFacet {
  tag: string
  /** Recipes this tag would leave, given the query and the other filters. */
  count: number
  active: boolean
}

/** Canonical form for near-duplicate detection: lowercase, hyphens/underscores → spaces */
function canonicalize(s: string) {
  return s.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function useRecipeFilter<T extends SearchableRecipe>({
  recipes,
  initialQuery = '',
  initialTags = [],
  initialFavouritesOnly = false,
}: UseRecipeFilterOptions<T>) {
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [activeFilters, setActiveFilters] = useState<string[]>(initialTags)
  const [favouritesOnly, setFavouritesOnly] = useState(initialFavouritesOnly)

  const index = useMemo(() => buildIndex(recipes), [recipes])

  // Canonical tag → the spelling used most often, in library-wide frequency order.
  // The order is stable so chips don't jump around as results change.
  const tagOrder = useMemo(() => {
    const byKey = new Map<string, { spelling: string; count: number }>()
    for (const r of recipes) {
      for (const tag of r.recipe_data.tags ?? []) {
        const key = canonicalize(tag)
        const existing = byKey.get(key)
        if (existing) existing.count++
        else byKey.set(key, { spelling: tag, count: 1 })
      }
    }
    return Array.from(byKey.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([key, v]) => ({ key, spelling: v.spelling }))
  }, [recipes])

  const outcome = useMemo(() => searchRecipes(index, searchQuery), [index, searchQuery])

  const { results, tagFacets, favouriteCount } = useMemo(() => {
    const activeKeys = activeFilters.map(canonicalize)
    const keysOf = (r: SearchResult<T>) => new Set((r.recipe.recipe_data.tags ?? []).map(canonicalize))

    // Tags narrow (AND); favourites narrows too.
    const passes = (r: SearchResult<T>, skipFavourites = false) => {
      if (!skipFavourites && favouritesOnly && !r.recipe.is_favorite) return false
      const keys = keysOf(r)
      return activeKeys.every((k) => keys.has(k))
    }

    const filtered = outcome.results.filter((r) => passes(r))

    // Counts are "what you'd get if you tapped this", so they never lead to zero.
    const counts = new Map<string, number>()
    for (const r of filtered) for (const k of keysOf(r)) counts.set(k, (counts.get(k) ?? 0) + 1)

    const facets: TagFacet[] = tagOrder
      .map(({ key, spelling }) => ({
        tag: spelling,
        count: counts.get(key) ?? 0,
        active: activeKeys.includes(key),
      }))
      .filter((f) => f.active || f.count > 0)
      // Applied filters lead the row so they're never scrolled out of sight.
      .sort((a, b) => Number(b.active) - Number(a.active))

    const favourites = outcome.results.filter((r) => passes(r, true) && r.recipe.is_favorite).length

    return { results: filtered, tagFacets: facets, favouriteCount: favourites }
  }, [outcome, activeFilters, favouritesOnly, tagOrder])

  const toggleFilter = (tag: string) => {
    const key = canonicalize(tag)
    setActiveFilters((prev) =>
      prev.some((f) => canonicalize(f) === key)
        ? prev.filter((f) => canonicalize(f) !== key)
        : [...prev, tag],
    )
  }

  const clearFilters = () => {
    setActiveFilters([])
    setFavouritesOnly(false)
  }

  const clearAll = () => {
    clearFilters()
    setSearchQuery('')
  }

  return {
    searchQuery,
    setSearchQuery,
    isSearching: outcome.terms.length > 0,
    activeFilters,
    setActiveFilters,
    toggleFilter,
    favouritesOnly,
    setFavouritesOnly,
    hasFilters: activeFilters.length > 0 || favouritesOnly,
    clearFilters,
    clearAll,
    tagFacets,
    favouriteCount,
    results,
    /** Results before tag/favourite filters — to tell "filters hid it" from "nothing matched". */
    unfilteredCount: outcome.results.length,
    partial: outcome.partial,
    unmatchedTerms: outcome.unmatchedTerms,
    terms: outcome.terms,
  }
}
