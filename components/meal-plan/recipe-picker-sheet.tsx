'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImprovedRecipe } from '@/lib/recipe-types'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Clock, Users, ChefHat, Loader2, X } from 'lucide-react'

interface SavedRecipe {
  id: string
  title: string
  recipe_data: ImprovedRecipe
  created_at: string
}

interface RecipePickerSheetProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (recipeId: string) => void
}

export function RecipePickerSheet({ isOpen, onClose, onSelect }: RecipePickerSheetProps) {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)
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
    if (activeFilters.length === 0) return recipes
    return recipes.filter(r => {
      const tags = r.recipe_data.tags ?? []
      return activeFilters.every(f => tags.includes(f))
    })
  }, [recipes, activeFilters])

  const toggleFilter = (tag: string) => {
    setActiveFilters(prev =>
      prev.includes(tag) ? prev.filter(f => f !== tag) : [...prev, tag]
    )
  }

  useEffect(() => {
    if (!isOpen) return

    const fetchRecipes = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('saved_recipes')
        .select('id, title, recipe_data, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching recipes:', error)
      }
      setRecipes(data ?? [])
      setLoading(false)
    }

    fetchRecipes()
    setActiveFilters([])
  }, [isOpen])

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/30">
          <SheetTitle>Choose a recipe</SheetTitle>
          <SheetDescription>Pick a saved recipe for this day</SheetDescription>
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

              {activeFilters.length > 0 && filteredRecipes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recipes match the selected filters.</p>
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
