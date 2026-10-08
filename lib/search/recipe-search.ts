import type { ImprovedRecipe } from '@/lib/recipe-types'

/**
 * Client-side recipe search: word-start matching with light stemming,
 * synonyms and typo tolerance, scored by which field matched. Pure and
 * framework-free so `scripts/search-relevance.ts` can exercise it directly.
 */

export interface SearchableRecipe {
  id: string
  title: string
  recipe_data: ImprovedRecipe
  created_at: string
  is_favorite?: boolean
  last_opened_at?: string | null
}

// Step text was tried and dropped: "serve with rice" put half the library under "rice".
type Field = 'title' | 'tag' | 'ingredient' | 'description'

/** Points for the best place a query word matched. Prefix = word-start of a longer word. */
const WEIGHTS: Record<Field, { exact: number; prefix: number }> = {
  title: { exact: 10, prefix: 7 },
  tag: { exact: 6, prefix: 4 },
  ingredient: { exact: 5, prefix: 3 },
  // Prefixes are off for prose: "pie" shouldn't find "a piece of ginger".
  description: { exact: 2, prefix: 0 },
}
/** Typos are only forgiven in short, specific fields — prose is full of near-misses (chicken/thicken). */
const FUZZY_FIELDS = new Set<Field>(['title', 'tag', 'ingredient'])
const FUZZY_FACTOR = 0.5
const PHRASE_IN_TITLE_BONUS = 5
const TITLE_STARTS_WITH_BONUS = 3
const QUICK_MINUTES = 30

const STOPWORDS = new Set([
  'a', 'an', 'and', 'the', 'with', 'of', 'in', 'for', 'to', 'or', 'on',
  'recipe', 'recipes', 'some', 'my', 'using', 'without',
])

/** US/UK and everyday synonyms, folded to one spelling on both sides. */
const WORD_SYNONYMS: Record<string, string> = {
  eggplant: 'aubergine',
  zucchini: 'courgette',
  cilantro: 'coriander',
  garbanzo: 'chickpea',
  shrimp: 'prawn',
  scallion: 'spring onion',
  arugula: 'rocket',
  veggie: 'vegetarian',
  lasagna: 'lasagne',
  yogurt: 'yoghurt',
  chili: 'chilli',
}
const PHRASE_SYNONYMS: [RegExp, string][] = [
  [/\bground beef\b/g, 'beef mince'],
  [/\bminced beef\b/g, 'beef mince'],
  [/\bbell peppers?\b/g, 'pepper'],
]

const QUICK_WORDS = new Set(['quick', 'fast', 'speedy'])
const EASY_WORDS = new Set(['easy', 'simple'])

export function normalize(text: string): string {
  let s = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  for (const [pattern, replacement] of PHRASE_SYNONYMS) s = s.replace(pattern, replacement)
  return s
    .split(' ')
    .map((w) => WORD_SYNONYMS[w] ?? w)
    .join(' ')
}

/** Just enough to fold plurals: leeks → leek, tomatoes → tomato, berries → berry. */
export function stem(word: string): string {
  if (word.length <= 3) return word
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y'
  if (word.endsWith('oes')) return word.slice(0, -2)
  if (/(ches|shes|xes|sses)$/.test(word)) return word.slice(0, -2)
  if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us')) return word.slice(0, -1)
  return word
}

function words(text: string): string[] {
  const n = normalize(text)
  return n ? n.split(' ') : []
}

function editDistanceWithin(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
      rowMin = Math.min(rowMin, curr[j])
    }
    if (rowMin > max) return false
    prev = curr
  }
  return prev[b.length] <= max
}

/** Parses "25 mins", "1 hr 20 mins", "12 hrs" into minutes. */
export function parseMinutes(value: string | undefined): number | null {
  if (!value) return null
  const s = value.toLowerCase()
  const hours = s.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/)
  const mins = s.match(/(\d+)\s*(?:m|min|mins|minute|minutes)\b/)
  if (!hours && !mins) return null
  return Math.round((hours ? parseFloat(hours[1]) * 60 : 0) + (mins ? parseInt(mins[1], 10) : 0))
}

export function totalMinutes(recipe: ImprovedRecipe): number | null {
  return (
    parseMinutes(recipe.totalTime) ??
    sumOrNull(parseMinutes(recipe.prepTime), parseMinutes(recipe.cookTime))
  )
}

function sumOrNull(a: number | null, b: number | null): number | null {
  return a == null && b == null ? null : (a ?? 0) + (b ?? 0)
}

// ── Index ────────────────────────────────────────────────────────────────

interface IndexedEntry {
  field: Field
  /** Original text, for "why it matched" (an ingredient name, a tag). */
  label: string
  stems: string[]
  raw: string[]
}

export interface IndexedRecipe<T extends SearchableRecipe> {
  recipe: T
  entries: IndexedEntry[]
  normalizedTitle: string
  minutes: number | null
}

function entry(field: Field, label: string): IndexedEntry {
  const raw = words(label)
  return { field, label, raw, stems: raw.map(stem) }
}

export function buildIndex<T extends SearchableRecipe>(recipes: T[]): IndexedRecipe<T>[] {
  return recipes.map((recipe) => {
    const data = recipe.recipe_data
    const entries: IndexedEntry[] = [
      entry('title', recipe.title),
      ...(data.tags ?? []).map((t) => entry('tag', t)),
      ...(data.ingredients ?? []).map((i) => entry('ingredient', i.name)),
      entry('description', data.description ?? ''),
    ]
    return {
      recipe,
      entries,
      normalizedTitle: normalize(recipe.title),
      minutes: totalMinutes(data),
    }
  })
}

// ── Query ────────────────────────────────────────────────────────────────

interface Term {
  raw: string
  stem: string
  /** Only the word being typed gets word-start matching. */
  allowPrefix: boolean
  intent: 'quick' | 'easy' | null
  /** Set when nothing in the library matches the word as typed — i.e. it's probably a typo. */
  allowFuzzy: boolean
}

export function parseQuery(query: string): Term[] {
  const endsMidWord = !/\s$/.test(query)
  const tokens = words(query).filter((w) => !STOPWORDS.has(w))
  return tokens.map((raw, i) => ({
    raw,
    stem: stem(raw),
    allowPrefix: endsMidWord && i === tokens.length - 1,
    intent: QUICK_WORDS.has(raw) ? 'quick' : EASY_WORDS.has(raw) ? 'easy' : null,
    allowFuzzy: false,
  }))
}

// ── Scoring ──────────────────────────────────────────────────────────────

export type MatchReason =
  | { kind: 'ingredient'; label: string }
  | { kind: 'tag'; label: string }
  | { kind: 'text'; snippet: string }
  | { kind: 'time'; minutes: number }
  | { kind: 'difficulty'; label: string }

export interface SearchResult<T extends SearchableRecipe> {
  recipe: T
  score: number
  /** Terms (normalized) that matched in this recipe. */
  matchedTerms: string[]
  /** Terms that matched in the title — the UI highlights these. */
  titleTerms: string[]
  reasons: MatchReason[]
}

interface TermMatch {
  score: number
  entry: IndexedEntry | null
  wordIndex: number
  reason: MatchReason | null
}

function matchTerm<T extends SearchableRecipe>(term: Term, indexed: IndexedRecipe<T>): TermMatch | null {
  let best: TermMatch | null = null
  const consider = (m: TermMatch) => {
    if (!best || m.score > best.score) best = m
  }

  // "quick" and "easy" mean a property of the recipe, not the word in a title
  // ("Quick-Pickled Cucumber" takes hours).
  const textEntries = term.intent ? indexed.entries.filter((e) => e.field === 'tag') : indexed.entries

  for (const e of textEntries) {
    const w = WEIGHTS[e.field]
    for (let i = 0; i < e.stems.length; i++) {
      if (e.stems[i] === term.stem) {
        consider({ score: w.exact, entry: e, wordIndex: i, reason: null })
      } else if (term.allowPrefix && w.prefix > 0 && e.raw[i].startsWith(term.raw)) {
        consider({ score: w.prefix, entry: e, wordIndex: i, reason: null })
      }
    }
  }

  if (term.intent === 'quick' && indexed.minutes != null && indexed.minutes <= QUICK_MINUTES) {
    consider({ score: WEIGHTS.tag.exact, entry: null, wordIndex: -1, reason: { kind: 'time', minutes: indexed.minutes } })
  }
  if (term.intent === 'easy' && indexed.recipe.recipe_data.difficulty === 'Easy') {
    consider({ score: WEIGHTS.tag.exact, entry: null, wordIndex: -1, reason: { kind: 'difficulty', label: 'Easy' } })
  }

  // Typos only when the word matches nothing as typed, and is long enough to be unambiguous.
  if (!best && term.allowFuzzy) {
    const max = term.raw.length >= 8 ? 2 : 1
    for (const e of indexed.entries) {
      if (!FUZZY_FIELDS.has(e.field)) continue
      for (let i = 0; i < e.stems.length; i++) {
        if (e.stems[i].length >= 4 && editDistanceWithin(term.stem, e.stems[i], max)) {
          consider({ score: WEIGHTS[e.field].exact * FUZZY_FACTOR, entry: e, wordIndex: i, reason: null })
        }
      }
    }
  }

  return best
}

function snippetAround(label: string, wordIndex: number): string {
  const original = label.split(/\s+/)
  // Normalized and original word counts can drift on punctuation; clamp.
  const i = Math.min(wordIndex, original.length - 1)
  const start = Math.max(0, i - 4)
  const end = Math.min(original.length, i + 5)
  return `${start > 0 ? '…' : ''}${original.slice(start, end).join(' ')}${end < original.length ? '…' : ''}`
}

function reasonFor(m: TermMatch): MatchReason | null {
  if (m.reason) return m.reason
  if (!m.entry) return null
  switch (m.entry.field) {
    case 'title':
      return null
    case 'ingredient':
      return { kind: 'ingredient', label: m.entry.label }
    case 'tag':
      return { kind: 'tag', label: m.entry.label }
    default:
      return { kind: 'text', snippet: snippetAround(m.entry.label, m.wordIndex) }
  }
}

function dedupeReasons(reasons: MatchReason[]): MatchReason[] {
  const seen = new Set<string>()
  const out: MatchReason[] = []
  for (const r of reasons) {
    const key = JSON.stringify(r)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(r)
  }
  // A text snippet is only worth showing when nothing more specific matched.
  const specific = out.filter((r) => r.kind !== 'text')
  return specific.length > 0 ? specific : out.slice(0, 1)
}

function scoreRecipe<T extends SearchableRecipe>(
  terms: Term[],
  indexed: IndexedRecipe<T>,
  normalizedQuery: string,
): SearchResult<T> & { termsMatched: number } {
  let score = 0
  const matchedTerms: string[] = []
  const titleTerms: string[] = []
  const reasons: MatchReason[] = []

  for (const term of terms) {
    const m = matchTerm(term, indexed)
    if (!m) continue
    score += m.score
    matchedTerms.push(term.raw)
    if (m.entry?.field === 'title') titleTerms.push(term.raw)
    const reason = reasonFor(m)
    if (reason) reasons.push(reason)
  }

  if (matchedTerms.length > 0 && normalizedQuery) {
    if (indexed.normalizedTitle.includes(normalizedQuery)) score += PHRASE_IN_TITLE_BONUS
    if (indexed.normalizedTitle.startsWith(normalizedQuery)) score += TITLE_STARTS_WITH_BONUS
  }

  return {
    recipe: indexed.recipe,
    score,
    matchedTerms,
    titleTerms,
    reasons: dedupeReasons(reasons),
    termsMatched: matchedTerms.length,
  }
}

/** Browsing order, and the tie-break under relevance: favourites → last opened → newest. */
export function compareBrowse(a: SearchableRecipe, b: SearchableRecipe): number {
  const fav = Number(!!b.is_favorite) - Number(!!a.is_favorite)
  if (fav !== 0) return fav
  const opened = time(b.last_opened_at) - time(a.last_opened_at)
  if (opened !== 0) return opened
  return time(b.created_at) - time(a.created_at)
}

function time(value: string | null | undefined): number {
  return value ? new Date(value).getTime() : 0
}

export interface SearchOutcome<T extends SearchableRecipe> {
  results: SearchResult<T>[]
  /** True when nothing matched every word, so results match only some. */
  partial: boolean
  /** Query words that no result matched (for the partial-match message). */
  unmatchedTerms: string[]
  terms: string[]
}

export function searchRecipes<T extends SearchableRecipe>(
  index: IndexedRecipe<T>[],
  query: string,
): SearchOutcome<T> {
  const terms = parseQuery(query)
  for (const term of terms) {
    term.allowFuzzy = term.raw.length >= 5 && !index.some((i) => matchTerm(term, i))
  }
  if (terms.length === 0) {
    return {
      results: index
        .map((i) => ({ recipe: i.recipe, score: 0, matchedTerms: [], titleTerms: [], reasons: [] }))
        .sort((a, b) => compareBrowse(a.recipe, b.recipe)),
      partial: false,
      unmatchedTerms: [],
      terms: [],
    }
  }

  const normalizedQuery = terms.map((t) => t.raw).join(' ')
  const scored = index.map((i) => scoreRecipe(terms, i, normalizedQuery))
  const byRelevance = (a: (typeof scored)[number], b: (typeof scored)[number]) =>
    b.score - a.score || compareBrowse(a.recipe, b.recipe)

  const full = scored.filter((r) => r.termsMatched === terms.length).sort(byRelevance)
  if (full.length > 0 || terms.length === 1) {
    return { results: full.map(strip), partial: false, unmatchedTerms: [], terms: terms.map((t) => t.raw) }
  }

  // Nothing has every word: fall back to the recipes that match the most.
  const partial = scored
    .filter((r) => r.termsMatched > 0)
    .sort((a, b) => b.termsMatched - a.termsMatched || byRelevance(a, b))
  const matchedAnywhere = new Set(partial.flatMap((r) => r.matchedTerms))
  return {
    results: partial.map(strip),
    partial: partial.length > 0,
    unmatchedTerms: terms.map((t) => t.raw).filter((t) => !matchedAnywhere.has(t)),
    terms: terms.map((t) => t.raw),
  }
}

function strip<T extends SearchableRecipe>({ termsMatched: _, ...rest }: SearchResult<T> & { termsMatched: number }): SearchResult<T> {
  return rest
}

/** Splits a title into chunks, flagging words that match the given query terms. */
export function highlightTitle(title: string, terms: string[]): { text: string; match: boolean }[] {
  if (terms.length === 0) return [{ text: title, match: false }]
  const termStems = terms.map(stem)
  return title.split(/(\s+)/).map((chunk) => {
    const w = words(chunk)
    const match = w.length > 0 && w.some((word) => termStems.some((t) => stem(word) === t || word.startsWith(t)))
    return { text: chunk, match }
  })
}
