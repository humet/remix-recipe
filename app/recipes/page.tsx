'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { deleteRecipe, listRecipes, setFavorite, type RecipeListRow } from '@/lib/data'
import { useRecipeFilter } from '@/hooks/use-recipe-filter'
import { emitDataChange, useDataChangeListener } from '@/lib/events'
import { SearchField } from '@/components/recipe-search/search-field'
import { FilterChips } from '@/components/recipe-search/filter-chips'
import { ResultRow } from '@/components/recipe-search/result-row'
import { NoResults, SearchStatus } from '@/components/recipe-search/search-status'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Heart, Trash2, Loader2, ArrowLeft } from 'lucide-react'

const SCROLL_KEY = 'remix:recipes-scroll'

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<RecipeListRow | null>(null)
  const [urlReady, setUrlReady] = useState(false)

  const search = useRecipeFilter({ recipes })
  const { searchQuery, setSearchQuery, activeFilters, setActiveFilters, favouritesOnly, setFavouritesOnly } = search

  const fetchRecipes = async () => {
    setRecipes(await listRecipes())
    setLoading(false)
  }

  useEffect(() => {
    fetchRecipes()
  }, [])

  useDataChangeListener('recipes-changed', fetchRecipes)

  // Search state lives in the URL, so Back from a recipe returns to the same results.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setSearchQuery(params.get('q') ?? '')
    setActiveFilters(params.get('tags')?.split(',').filter(Boolean) ?? [])
    setFavouritesOnly(params.get('fav') === '1')
    setUrlReady(true)
  }, [])

  useEffect(() => {
    if (!urlReady) return
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (activeFilters.length) params.set('tags', activeFilters.join(','))
    if (favouritesOnly) params.set('fav', '1')
    const qs = params.toString()
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
  }, [urlReady, searchQuery, activeFilters, favouritesOnly])

  // Put the list back where it was once it has loaded.
  useEffect(() => {
    if (loading || !urlReady) return
    try {
      const saved = sessionStorage.getItem(SCROLL_KEY)
      if (saved) {
        sessionStorage.removeItem(SCROLL_KEY)
        window.scrollTo(0, Number(saved))
      }
    } catch {
      // Storage unavailable; start at the top.
    }
  }, [loading, urlReady])

  const rememberScroll = () => {
    try {
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))
    } catch {
      // Storage unavailable; nothing to restore later.
    }
  }

  const toggleFavorite = async (recipe: RecipeListRow) => {
    const newVal = !recipe.is_favorite
    setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, is_favorite: newVal } : r))
    await setFavorite(recipe.id, newVal)
    emitDataChange('recipes-changed')
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await deleteRecipe(id)
    setRecipes(prev => prev.filter(r => r.id !== id))
    setDeletingId(null)
    emitDataChange('recipes-changed')
  }

  return (
    <main className="min-h-screen bg-background">
      <h1 className="sr-only">All recipes</h1>

      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-2 px-5 pt-4 pb-2">
          <Link
            href="/"
            className="h-12 w-12 flex items-center justify-center rounded-xl glass shrink-0"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <SearchField value={searchQuery} onChange={setSearchQuery} />
        </div>
        <FilterChips
          className="pb-3"
          facets={search.tagFacets}
          onToggleTag={search.toggleFilter}
          favouritesOnly={favouritesOnly}
          favouriteCount={search.favouriteCount}
          onToggleFavourites={() => setFavouritesOnly(v => !v)}
          hasFilters={search.hasFilters}
          onClear={search.clearFilters}
        />
      </div>

      <div className="px-5 pt-3 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-12 px-6">
            <p className="font-medium text-foreground">No saved recipes yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Remix a recipe and save it, and it’ll show up here.
            </p>
            <Link href="/" className="inline-block mt-4 text-sm font-medium text-primary">
              Remix your first recipe
            </Link>
          </div>
        ) : search.results.length === 0 ? (
          <NoResults
            query={searchQuery}
            hiddenByFilters={search.hasFilters ? search.unfilteredCount : 0}
            onClearFilters={search.clearFilters}
            onClearSearch={() => setSearchQuery('')}
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
              {search.results.map((result) => {
                const saved = result.recipe
                return (
                  <li key={saved.id}>
                    <ResultRow
                      result={result}
                      href={`/recipe/${saved.id}`}
                      onNavigate={rememberScroll}
                      actions={
                        <>
                          <button
                            onClick={() => toggleFavorite(saved)}
                            className="h-11 w-11 flex items-center justify-center rounded-full transition-colors"
                            aria-label={saved.is_favorite ? 'Remove from favourites' : 'Add to favourites'}
                            aria-pressed={!!saved.is_favorite}
                          >
                            <Heart
                              className={`h-5 w-5 ${saved.is_favorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
                            />
                          </button>
                          <button
                            onClick={() => setPendingDelete(saved)}
                            disabled={deletingId === saved.id}
                            className="h-11 w-11 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive transition-colors"
                            aria-label={`Delete ${saved.title}`}
                          >
                            {deletingId === saved.id ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Trash2 className="h-5 w-5" />
                            )}
                          </button>
                        </>
                      }
                    />
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this recipe?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.title}” will be removed from your recipes and your meal plan. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="h-11 bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) handleDelete(pendingDelete.id)
                setPendingDelete(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
