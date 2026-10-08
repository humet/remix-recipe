'use client'

import { useEffect, useRef, useState } from 'react'
import { listRecipes, type RecipeListRow } from '@/lib/data'
import { useRecipeFilter } from '@/hooks/use-recipe-filter'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Loader2 } from 'lucide-react'
import { SearchField } from '@/components/recipe-search/search-field'
import { FilterChips } from '@/components/recipe-search/filter-chips'
import { ResultRow } from '@/components/recipe-search/result-row'
import { NoResults, SearchStatus } from '@/components/recipe-search/search-status'
import { useDataChangeListener } from '@/lib/events'

function useKeyboardOffset() {
  const [offset, setOffset] = useState({ keyboardHeight: 0, viewportHeight: 0, offsetTop: 0 })
  const rafRef = useRef(0)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const keyboardHeight = window.innerHeight - vv.height
        setOffset({
          keyboardHeight: Math.max(0, keyboardHeight),
          viewportHeight: vv.height,
          offsetTop: vv.offsetTop,
        })
      })
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      cancelAnimationFrame(rafRef.current)
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  return offset
}

interface RecipePickerSheetProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (recipeId: string) => void
}

export function RecipePickerSheet({ isOpen, onClose, onSelect }: RecipePickerSheetProps) {
  const [recipes, setRecipes] = useState<RecipeListRow[]>([])
  const [loading, setLoading] = useState(true)
  const { keyboardHeight, viewportHeight, offsetTop } = useKeyboardOffset()

  const search = useRecipeFilter({ recipes })
  const { searchQuery, setSearchQuery, favouritesOnly, setFavouritesOnly } = search

  const fetchRecipes = async () => {
    setLoading(true)
    setRecipes(await listRecipes())
    setLoading(false)
  }

  useEffect(() => {
    if (!isOpen) return
    fetchRecipes()
    search.clearAll()
  }, [isOpen])

  useDataChangeListener('recipes-changed', fetchRecipes)

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl overflow-hidden flex flex-col p-0"
        style={{
          maxHeight: keyboardHeight > 0
            ? viewportHeight + keyboardHeight
            : viewportHeight > 0 ? viewportHeight * 0.85 : '85vh',
          transform: offsetTop > 0 ? `translateY(${offsetTop}px)` : undefined,
        }}
      >
        <SheetHeader className="px-5 pt-5 pb-2">
          <SheetTitle>Choose a recipe</SheetTitle>
          <SheetDescription>Pick a saved recipe for this day</SheetDescription>
          <SearchField value={searchQuery} onChange={setSearchQuery} className="mt-2" />
        </SheetHeader>
        {!loading && recipes.length > 0 && (
          <FilterChips
            className="pb-3 border-b border-border/30"
            facets={search.tagFacets}
            onToggleTag={search.toggleFilter}
            favouritesOnly={favouritesOnly}
            favouriteCount={search.favouriteCount}
            onToggleFavourites={() => setFavouritesOnly(v => !v)}
            hasFilters={search.hasFilters}
            onClear={search.clearFilters}
          />
        )}

        <div className="flex-1 overflow-y-auto px-5 pt-3" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : 32 }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recipes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No saved recipes yet. Remix a recipe first, then save it to add it to your plan.
            </p>
          ) : search.results.length === 0 ? (
            <NoResults
              query={searchQuery}
              hiddenByFilters={search.hasFilters ? search.unfilteredCount : 0}
              onClearFilters={search.clearFilters}
              onClearSearch={() => setSearchQuery('')}
              showRemix={false}
            />
          ) : (
            <>
              <SearchStatus
                total={search.results.length}
                isSearching={search.isSearching}
                hasFilters={search.hasFilters}
                partial={search.partial}
                unmatchedTerms={search.unmatchedTerms}
              />
              <ul className="flex flex-col gap-3 mt-2">
                {search.results.map((result) => (
                  <li key={result.recipe.id}>
                    <ResultRow result={result} onSelect={() => onSelect(result.recipe.id)} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
