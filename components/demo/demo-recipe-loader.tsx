'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { getRecipe, touchRecipe } from '@/lib/data'
import type { SavedRecipe } from '@/lib/recipe-types'
import { RecipePageClient } from '@/app/recipe/[id]/recipe-page-client'

/**
 * In demo mode the localStorage store is the only source of truth — the id
 * may be a seeded fixture or a recipe the demo visitor just saved — so the
 * lookup has to happen in the browser rather than on the server.
 */
export function DemoRecipeLoader({ id }: { id: string }) {
  const [row, setRow] = useState<SavedRecipe | null>(null)
  const [status, setStatus] = useState<'loading' | 'missing' | 'ready'>('loading')

  useEffect(() => {
    let cancelled = false

    getRecipe(id).then((recipe) => {
      if (cancelled) return
      if (!recipe) {
        setStatus('missing')
        return
      }
      setRow(recipe)
      setStatus('ready')
      touchRecipe(id)
    })

    return () => {
      cancelled = true
    }
  }, [id])

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (status === 'missing' || !row) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="glass rounded-2xl p-6 text-center flex flex-col items-center gap-3 max-w-sm">
          <h1 className="font-semibold text-foreground">Recipe not found</h1>
          <p className="text-sm text-muted-foreground">
            This recipe isn’t in the demo. Saved demo recipes live in this browser only.
          </p>
          <Link
            href="/"
            className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <RecipePageClient
      initialRecipe={row.recipe_data}
      savedRecipeId={row.id}
      originalInput={row.original_input}
      originalAnalysis={row.original_analysis}
    />
  )
}
