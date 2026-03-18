'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SavedRecipe } from '@/lib/recipe-types'
import { useRecipeFilter } from '@/hooks/use-recipe-filter'
import { emitDataChange, useDataChangeListener } from '@/lib/events'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Clock, Users, ChefHat, Heart, Trash2, Loader2, Search, X, ArrowLeft } from 'lucide-react'

const MAX_VISIBLE_TAGS = 12

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAllTags, setShowAllTags] = useState(false)

  const {
    searchQuery,
    setSearchQuery,
    activeFilters,
    toggleFilter,
    setActiveFilters,
    allTags,
    tagCounts,
    filteredRecipes,
  } = useRecipeFilter({ recipes })

  const fetchRecipes = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('saved_recipes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching recipes:', error)
    }
    setRecipes(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchRecipes()
  }, [])

  useDataChangeListener('recipes-changed', fetchRecipes)

  const toggleFavorite = async (e: React.MouseEvent, recipe: SavedRecipe) => {
    e.preventDefault()
    e.stopPropagation()
    const newVal = !recipe.is_favorite
    setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, is_favorite: newVal } : r))
    const supabase = createClient()
    await supabase.from('saved_recipes').update({ is_favorite: newVal }).eq('id', recipe.id)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from('saved_recipes').delete().eq('id', id)
    setRecipes(prev => prev.filter(r => r.id !== id))
    setDeletingId(null)
    emitDataChange('recipes-changed')
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Tags to display: active filters always shown, plus top tags up to limit
  const isSearching = searchQuery.trim().length > 0
  const hiddenTagCount = Math.max(0, allTags.length - MAX_VISIBLE_TAGS)
  const visibleTags = showAllTags ? allTags : allTags.slice(0, MAX_VISIBLE_TAGS)
  // Ensure active filters are always visible even if beyond the limit
  const extraActiveTags = activeFilters.filter(f => !visibleTags.includes(f))
  const displayTags = [...visibleTags, ...extraActiveTags]

  return (
    <main className="min-h-screen bg-background">
      {/* Sticky header with back arrow, title, and search */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/"
              className="h-10 w-10 flex items-center justify-center rounded-xl glass shrink-0"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">All Recipes</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-12 h-12 text-base glass border-none rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tags section — hidden when searching, unless active filters exist */}
      {allTags.length > 0 && (
        <div className="px-5 pt-3 pb-1">
          {isSearching && activeFilters.length > 0 ? (
            // Compact inline summary when searching with active filters
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Filtering:</span>
              {activeFilters.map(tag => (
                <Badge
                  key={tag}
                  variant="default"
                  className="cursor-pointer select-none py-1 px-2.5 text-xs"
                  onClick={() => toggleFilter(tag)}
                >
                  {tag}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
              <button
                onClick={() => setActiveFilters([])}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            </div>
          ) : !isSearching ? (
            // Full tag pills when not searching
            <div className="flex flex-wrap gap-2 items-center">
              {displayTags.map(tag => (
                <Badge
                  key={tag}
                  variant={activeFilters.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer select-none py-1.5 px-3 text-xs"
                  onClick={() => toggleFilter(tag)}
                >
                  {tag}
                  {tagCounts.get(tag) != null && (
                    <span className="ml-1 opacity-60">{tagCounts.get(tag)}</span>
                  )}
                </Badge>
              ))}
              {!showAllTags && hiddenTagCount > 0 && (
                <button
                  onClick={() => setShowAllTags(true)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2"
                >
                  +{hiddenTagCount} more
                </button>
              )}
              {showAllTags && hiddenTagCount > 0 && (
                <button
                  onClick={() => setShowAllTags(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2"
                >
                  Show less
                </button>
              )}
              {activeFilters.length > 0 && (
                <button
                  onClick={() => setActiveFilters([])}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Recipe list */}
      <div className="px-5 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredRecipes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {recipes.length === 0 ? 'No saved recipes yet.' : 'No recipes match your search.'}
          </p>
        ) : (
          <div className="flex flex-col gap-3 mt-3">
            {filteredRecipes.map((saved) => {
              const recipe = saved.recipe_data
              return (
                <Link
                  key={saved.id}
                  href={`/recipe/${saved.id}`}
                  className="block w-full text-left glass rounded-2xl p-4 hover:ring-2 hover:ring-primary/30 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{saved.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {recipe.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 -mr-1">
                      <button
                        onClick={(e) => toggleFavorite(e, saved)}
                        className="h-11 w-11 flex items-center justify-center rounded-full transition-colors"
                        aria-label={saved.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart
                          className={`h-5 w-5 ${saved.is_favorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
                        />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, saved.id)}
                        disabled={deletingId === saved.id}
                        className="h-11 w-11 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Delete recipe"
                      >
                        {deletingId === saved.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {(recipe.tags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(recipe.tags ?? []).map(tag => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleFilter(tag)
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{recipe.totalTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{recipe.servings}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ChefHat className="h-3.5 w-3.5" />
                      <span>{recipe.difficulty}</span>
                    </div>
                    <span className="ml-auto">{formatDate(saved.created_at)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
