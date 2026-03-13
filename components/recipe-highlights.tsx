'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SavedRecipe } from '@/lib/recipe-types'
import { Clock, ChefHat, Heart, Loader2, ChevronRight } from 'lucide-react'
import { useDataChangeListener } from '@/lib/events'

export function RecipeHighlights() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecipes = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('saved_recipes')
      .select('id, title, recipe_data, created_at, is_favorite, last_opened_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching recipes:', error)
    }
    if (data) {
      setRecipes(data)
    }
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

  const favorites = recipes.filter(r => r.is_favorite)
  const recents = recipes
    .filter(r => r.last_opened_at && !r.is_favorite)
    .sort((a, b) => new Date(b.last_opened_at!).getTime() - new Date(a.last_opened_at!).getTime())

  const hasFavorites = favorites.length > 0
  const hasRecents = recents.length > 0

  // If no favorites or recents, show most recent recipes
  const fallbackRecipes = !hasFavorites && !hasRecents ? recipes.slice(0, 6) : []

  return (
    <div className="flex flex-col gap-5">
      {hasFavorites && (
        <Section title="Favorites">
          <HorizontalScroll>
            {favorites.slice(0, 4).map(r => (
              <CompactCard key={r.id} recipe={r} onToggleFavorite={toggleFavorite} />
            ))}
          </HorizontalScroll>
        </Section>
      )}

      {hasRecents && (
        <Section title="Recently Used">
          <HorizontalScroll>
            {recents.slice(0, 4).map(r => (
              <CompactCard key={r.id} recipe={r} onToggleFavorite={toggleFavorite} />
            ))}
          </HorizontalScroll>
        </Section>
      )}

      {fallbackRecipes.length > 0 && (
        <Section title="Your Recipes">
          <HorizontalScroll>
            {fallbackRecipes.map(r => (
              <CompactCard key={r.id} recipe={r} onToggleFavorite={toggleFavorite} />
            ))}
          </HorizontalScroll>
        </Section>
      )}

      <Link
        href="/recipes"
        className="flex items-center justify-center gap-2 glass rounded-2xl p-4 text-sm font-semibold text-primary hover:ring-2 hover:ring-primary/30 transition-all active:scale-[0.98]"
      >
        View all recipes ({recipes.length})
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  )
}

function HorizontalScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-5 px-5 overflow-x-auto scrollbar-none">
      <div className="flex gap-3 pb-1" style={{ minWidth: 'min-content' }}>
        {children}
      </div>
    </div>
  )
}

function CompactCard({
  recipe,
  onToggleFavorite,
}: {
  recipe: SavedRecipe
  onToggleFavorite: (e: React.MouseEvent, recipe: SavedRecipe) => void
}) {
  const data = recipe.recipe_data
  return (
    <Link
      href={`/recipe/${recipe.id}`}
      className="flex flex-col gap-2 glass rounded-2xl p-4 hover:ring-2 hover:ring-primary/30 transition-all active:scale-[0.98] w-40 shrink-0"
    >
      <div className="flex items-start justify-between gap-1">
        <h3 className="font-medium text-foreground text-sm leading-tight line-clamp-2 flex-1">{recipe.title}</h3>
        <button
          onClick={(e) => onToggleFavorite(e, recipe)}
          className="h-10 w-10 -mr-2 -mt-1 flex items-center justify-center rounded-full shrink-0 transition-colors"
          aria-label={recipe.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`h-4.5 w-4.5 ${recipe.is_favorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
          />
        </button>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-auto">
        {data.totalTime && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {data.totalTime}
          </span>
        )}
        <span className="flex items-center gap-1">
          <ChefHat className="h-3 w-3" />
          {data.difficulty}
        </span>
      </div>
    </Link>
  )
}
