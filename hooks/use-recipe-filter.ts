import { useMemo, useState } from 'react'
import { SavedRecipe } from '@/lib/recipe-types'

interface UseRecipeFilterOptions {
  recipes: SavedRecipe[]
}

export function useRecipeFilter({ recipes }: UseRecipeFilterOptions) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const r of recipes) {
      for (const tag of r.recipe_data.tags ?? []) {
        tagSet.add(tag)
      }
    }
    return Array.from(tagSet).sort()
  }, [recipes])

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

    // Tag filter (AND logic)
    if (activeFilters.length > 0) {
      result = result.filter(r => {
        const tags = r.recipe_data.tags ?? []
        return activeFilters.every(f => tags.includes(f))
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
    filteredRecipes,
  }
}
