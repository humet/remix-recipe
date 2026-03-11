'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ImprovedRecipe, RecipeAnalysis } from '@/lib/recipe-types'
import { Clock, Users, ChefHat, Trash2, Loader2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SavedRecipe {
  id: string
  title: string
  recipe_data: ImprovedRecipe
  original_input?: string
  original_analysis?: RecipeAnalysis
  created_at: string
}

interface SavedRecipesProps {
  onTagsChanged?: (tags: string[]) => void
}

export function SavedRecipes({ onTagsChanged }: SavedRecipesProps) {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
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

  useEffect(() => {
    onTagsChanged?.(allTags)
  }, [allTags, onTagsChanged])

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

  const fetchRecipes = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('saved_recipes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching saved recipes:', error)
    }
    if (data) {
      setRecipes(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRecipes()
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
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
              
              {(recipe.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(recipe.tags ?? []).map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 cursor-pointer"
                      onClick={(e) => {
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
  )
}
