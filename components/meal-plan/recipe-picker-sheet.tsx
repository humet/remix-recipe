'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SavedRecipe } from '@/lib/recipe-types'
import { useRecipeFilter } from '@/hooks/use-recipe-filter'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Clock, Users, ChefHat, Loader2, Search, X } from 'lucide-react'
import { useDataChangeListener } from '@/lib/events'

interface RecipePickerSheetProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (recipeId: string) => void
}

export function RecipePickerSheet({ isOpen, onClose, onSelect }: RecipePickerSheetProps) {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)

  const {
    searchQuery,
    setSearchQuery,
    activeFilters,
    toggleFilter,
    setActiveFilters,
    allTags,
    filteredRecipes,
  } = useRecipeFilter({ recipes })

  const fetchRecipes = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('saved_recipes')
      .select('id, title, recipe_data, created_at, is_favorite, last_opened_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching recipes:', error)
    }
    setRecipes(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (!isOpen) return
    fetchRecipes()
    setSearchQuery('')
    setActiveFilters([])
  }, [isOpen])

  useDataChangeListener('recipes-changed', fetchRecipes)

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/30">
          <SheetTitle>Choose a recipe</SheetTitle>
          <SheetDescription>Pick a saved recipe for this day</SheetDescription>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 glass border-none h-9 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5 pb-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recipes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No saved recipes yet. Remix a recipe first, then save it to add it to your plan.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  {allTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={activeFilters.includes(tag) ? 'default' : 'outline'}
                      className="cursor-pointer select-none"
                      onClick={() => toggleFilter(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                  {activeFilters.length > 0 && (
                    <button
                      onClick={() => setActiveFilters([])}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </button>
                  )}
                </div>
              )}

              {filteredRecipes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recipes match your search.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredRecipes.map((saved) => {
                    const recipe = saved.recipe_data
                    return (
                      <button
                        key={saved.id}
                        onClick={() => onSelect(saved.id)}
                        className="w-full text-left glass rounded-2xl p-4 hover:ring-2 hover:ring-primary/30 transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <h3 className="font-semibold text-foreground truncate">{saved.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {recipe.description}
                        </p>

                        {(recipe.tags ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(recipe.tags ?? []).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{recipe.cookTime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>{recipe.servings}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ChefHat className="h-3.5 w-3.5" />
                            <span>{recipe.difficulty}</span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
