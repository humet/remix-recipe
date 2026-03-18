import { useMemo, useState } from 'react'
import { SavedRecipe } from '@/lib/recipe-types'

interface UseRecipeFilterOptions {
  recipes: SavedRecipe[]
}

/** Canonical form for near-duplicate detection: lowercase, hyphens/underscores → spaces */
function canonicalize(s: string) {
  return s.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function useRecipeFilter({ recipes }: UseRecipeFilterOptions) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  // Build canonical → { bestSpelling, count } map, then return sorted unique tags
  const { allTags, tagCounts } = useMemo(() => {
    const canonicalMap = new Map<string, { spelling: string; count: number }>()

    for (const r of recipes) {
      for (const tag of r.recipe_data.tags ?? []) {
        const key = canonicalize(tag)
        const existing = canonicalMap.get(key)
        if (existing) {
          existing.count++
          // Keep whichever spelling appears more often (first one wins ties)
        } else {
          canonicalMap.set(key, { spelling: tag, count: 1 })
        }
      }
    }

    // Sort by frequency (most used first)
    const sorted = Array.from(canonicalMap.values())
      .sort((a, b) => b.count - a.count)

    const tags = sorted.map(e => e.spelling)
    const counts = new Map<string, number>()
    for (const e of sorted) {
      counts.set(e.spelling, e.count)
    }

    return { allTags: tags, tagCounts: counts }
  }, [recipes])

  // Map active filters through canonicalization so near-duplicate tags match recipes
  const filteredRecipes = useMemo(() => {
    let result = recipes

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(r => {
        const title = r.title.toLowerCase()
        const description = (r.recipe_data.description ?? '').toLowerCase()
        const tags = (r.recipe_data.tags ?? []).map(t => t.toLowerCase())
        return title.includes(q) || description.includes(q) || tags.some(t => t.includes(q))
      })
    }

    // Tag filter (AND logic) — match by canonical form so near-duplicates work
    if (activeFilters.length > 0) {
      const activeCanonical = activeFilters.map(canonicalize)
      result = result.filter(r => {
        const recipeTags = (r.recipe_data.tags ?? []).map(canonicalize)
        return activeCanonical.every(f => recipeTags.includes(f))
      })
    }

    // Sort: favorites first → last_opened_at DESC → created_at DESC
    result = [...result].sort((a, b) => {
      const aFav = a.is_favorite ? 1 : 0
      const bFav = b.is_favorite ? 1 : 0
      if (bFav !== aFav) return bFav - aFav

      const aOpened = a.last_opened_at ? new Date(a.last_opened_at).getTime() : 0
      const bOpened = b.last_opened_at ? new Date(b.last_opened_at).getTime() : 0
      if (bOpened !== aOpened) return bOpened - aOpened

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return result
  }, [recipes, searchQuery, activeFilters])

  const toggleFilter = (tag: string) => {
    setActiveFilters(prev =>
      prev.includes(tag) ? prev.filter(f => f !== tag) : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setActiveFilters([])
    setSearchQuery('')
  }

  return {
    searchQuery,
    setSearchQuery,
    activeFilters,
    toggleFilter,
    clearFilters,
    setActiveFilters,
    allTags,
    tagCounts,
    filteredRecipes,
  }
}
