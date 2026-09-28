'use client'

import Link from 'next/link'
import { ChefHat, Clock, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  highlightTitle,
  type MatchReason,
  type SearchableRecipe,
  type SearchResult,
} from '@/lib/search/recipe-search'

interface ResultRowProps<T extends SearchableRecipe> {
  result: SearchResult<T>
  /** A link row (the recipes page) or a choice (the meal-plan picker). */
  href?: string
  onSelect?: () => void
  onNavigate?: () => void
  /** Controls that sit on top of the row, e.g. favourite and delete. */
  actions?: React.ReactNode
}

export function ResultRow<T extends SearchableRecipe>({
  result,
  href,
  onSelect,
  onNavigate,
  actions,
}: ResultRowProps<T>) {
  const { recipe, titleTerms, reasons } = result
  const data = recipe.recipe_data
  // A description match is shown as an excerpt in the description's place, so it isn't said twice.
  const snippet = reasons.find((r) => r.kind === 'text')
  const specific = reasons.filter((r) => r.kind !== 'text')
  const time = data.totalTime || data.cookTime

  // The whole row is the tap target; the title's ::after stretches over it so
  // the action buttons can sit on top without nesting buttons inside a link.
  const stretch = "after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none"
  const title = (
    // Never clamped: the title is how a recipe is recognised, and a clamp can hide the very word that matched.
    <span className="text-pretty break-words">
      {highlightTitle(recipe.title, titleTerms).map((part, i) =>
        part.match ? (
          <mark key={i} className="bg-primary/15 text-foreground rounded-sm">
            {part.text}
          </mark>
        ) : (
          part.text
        ),
      )}
    </span>
  )

  return (
    <div
      className={cn(
        'relative glass rounded-2xl p-4 transition-all',
        'hover:ring-2 hover:ring-primary/30 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/60 active:scale-[0.98]',
      )}
    >
      <div className="min-w-0">
        {/* Only the title makes room for the actions; the lines below get the full width. */}
        <h3 className={cn('font-semibold text-foreground leading-snug', actions && 'pr-20')}>
          {href ? (
            <Link href={href} onClick={onNavigate} className={stretch}>
              {title}
            </Link>
          ) : (
            <button type="button" onClick={onSelect} className={cn('text-left', stretch)}>
              {title}
            </button>
          )}
        </h3>

        {/* Why it's in the results — kept apart from the description, which helps decide between them. */}
        {specific.length > 0 && (
          <p className="text-xs font-medium text-primary mt-1">
            <Reasons reasons={specific} />
          </p>
        )}

        {/* Two lines: enough of the first sentence to help decide. */}
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {snippet?.kind === 'text' ? `“${snippet.snippet}”` : data.description}
        </p>

        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          {time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {time}
            </span>
          )}
          {data.difficulty && (
            <span className="flex items-center gap-1">
              <ChefHat className="h-3.5 w-3.5" aria-hidden />
              {data.difficulty}
            </span>
          )}
          {data.servings && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">Serves</span>
              {data.servings}
            </span>
          )}
        </div>
      </div>

      {actions && <div className="absolute z-10 top-2 right-2 flex items-center">{actions}</div>}
    </div>
  )
}

/** "With leeks, potatoes · Tagged Soup" — why a non-title match is in the list. */
function Reasons({ reasons }: { reasons: MatchReason[] }) {
  const ingredients = reasons.flatMap((r) => (r.kind === 'ingredient' ? [r.label] : []))
  const tags = reasons.flatMap((r) => (r.kind === 'tag' ? [r.label] : []))
  const parts: React.ReactNode[] = []

  if (ingredients.length) parts.push(<>With <Em>{ingredients.join(', ')}</Em></>)
  if (tags.length) parts.push(<>Tagged <Em>{tags.join(', ')}</Em></>)
  for (const r of reasons) {
    if (r.kind === 'time') parts.push(<>Ready in <Em>{r.minutes} mins</Em></>)
    if (r.kind === 'difficulty') parts.push(<Em>{r.label}</Em>)
  }

  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && ' · '}
          {p}
        </span>
      ))}
    </>
  )
}

function Em({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold">{children}</span>
}
