'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImprovedRecipe, RecipeAnalysis } from '@/lib/recipe-types'
import { Clock, Users, ChefHat, Trash2, Loader2 } from 'lucide-react'

interface SavedRecipe {
  id: string
  title: string
  recipe_data: ImprovedRecipe
  original_input?: string
  original_analysis?: RecipeAnalysis
  created_at: string
}

interface SavedRecipesProps {
  onSelect: (recipe: ImprovedRecipe, savedId: string, originalInput?: string, originalAnalysis?: RecipeAnalysis) => void
}

export function SavedRecipes({ onSelect }: SavedRecipesProps) {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchRecipes = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('saved_recipes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) {
      setRecipes(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRecipes()
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeletingId(id)
    
    const supabase = createClient()
    await supabase.from('saved_recipes').delete().eq('id', id)
    
    setRecipes(prev => prev.filter(r => r.id !== id))
    setDeletingId(null)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (recipes.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">Saved Recipes</h2>
      <div className="flex flex-col gap-3">
        {recipes.map((saved) => {
          const recipe = saved.recipe_data
          return (
            <button
              key={saved.id}
              onClick={() => onSelect(recipe, saved.id, saved.original_input, saved.original_analysis)}
              className="w-full text-left glass rounded-2xl p-4 hover:ring-2 hover:ring-primary/30 transition-all active:scale-[0.98]"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{saved.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {recipe.description}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, saved.id)}
                  disabled={deletingId === saved.id}
                  className="h-8 w-8 flex items-center justify-center rounded-full glass text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  aria-label="Delete recipe"
                >
                  {deletingId === saved.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
              
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
            </button>
          )
        })}
      </div>
    </div>
  )
}
