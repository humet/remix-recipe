/**
 * Relevance check for recipe search, run against the demo fixtures.
 *
 *   pnpm search:check            # current search
 *   pnpm search:check --legacy   # the old substring matcher, for comparison
 *
 * Each case says what should rank first, what must be near the top, and what
 * must not appear. Add a case whenever a real query gives a bad result.
 */
import { DEMO_RECIPES } from '../lib/demo/fixtures/recipes'
import { buildIndex, searchRecipes, type SearchableRecipe } from '../lib/search/recipe-search'

interface Case {
  q: string
  /** Any of these ranks first. */
  first?: string[]
  /** All of these appear within the top `within` (default: their count). */
  top?: string[]
  within?: number
  /** All of these appear somewhere. */
  includes?: string[]
  /** None of these appear. */
  absent?: string[]
  /** [a, b]: a ranks above b. */
  above?: [string, string][]
  partial?: boolean
}

const CASES: Case[] = [
  { q: 'harissa', first: ['Harissa Chicken Traybake'] },
  {
    q: 'chicken',
    top: ['Harissa Chicken Traybake', 'Chicken Tikka Masala', 'Thai Green Curry with Chicken'],
    above: [['Thai Green Curry with Chicken', 'Crispy Smashed Potatoes']],
    // "thicken" is one letter from "chicken"; typo tolerance mustn't fire on a correctly spelled word.
    absent: ['Key Lime Pie'],
  },
  { q: 'chicken curry', top: ['Chicken Tikka Masala', 'Thai Green Curry with Chicken'], absent: ['Brown Butter Chocolate Chip Cookies'] },
  { q: 'curry chicken', top: ['Chicken Tikka Masala', 'Thai Green Curry with Chicken'] },
  { q: 'egg', first: ['Egg Fried Rice'], includes: ['Shakshuka', 'Weeknight Carbonara', 'Pad Thai'], absent: ['Veggie Chilli'] },
  { q: 'leek potato', first: ['Leek and Potato Soup'], absent: ['Creamy Leek and Bacon Pasta', 'Crispy Smashed Potatoes'] },
  { q: 'leeks', top: ['Leek and Potato Soup', 'Creamy Leek and Bacon Pasta'] },
  { q: 'with leeks', top: ['Leek and Potato Soup', 'Creamy Leek and Bacon Pasta'] },
  { q: 'tomatos', includes: ['Tomato and Basil Bruschetta'] },
  { q: 'chickpea', includes: ['Chickpea and Spinach Curry', 'Harissa Chicken Traybake'] },
  { q: 'rice', top: ['Egg Fried Rice', 'Coriander Lime Rice'], includes: ['Mushroom Risotto'], absent: ['Overnight Oats', 'Veggie Chilli'] },
  { q: 'ham', first: ['Honey Glazed Ham'], absent: ['Graham Cracker Cheesecake'] },
  { q: 'pie', first: ['Key Lime Pie'], absent: ['Ginger Beef Stir-Fry'] },
  { q: 'eggplant', includes: ['Aubergine Parmigiana', 'Thai Green Curry with Chicken'] },
  { q: 'zucchini', first: ['Courgette and Feta Fritters'] },
  { q: 'cilantro', includes: ['Coriander Lime Rice'] },
  { q: 'jalapeno', first: ['Jalapeño Cornbread'] },
  { q: 'ground beef', top: ['Spaghetti Bolognese', 'Classic Beef Lasagne'], within: 3 },
  { q: 'lasagna', first: ['Classic Beef Lasagne'] },
  { q: 'one pot', includes: ['Veggie Chilli', 'Shakshuka', 'Chickpea and Spinach Curry'] },
  { q: 'quick pasta', includes: ['Weeknight Carbonara', 'Creamy Leek and Bacon Pasta'], absent: ['Classic Beef Lasagne', 'Pad Thai'] },
  // "quick" is about time, not the word in "Quick-Pickled Cucumber".
  { q: 'quick', first: ['Egg Fried Rice', 'Weeknight Carbonara', 'Creamy Leek and Bacon Pasta', 'Tomato and Basil Bruschetta'], absent: ['Sticky Pork Belly Bao Buns with Quick-Pickled Cucumber and Crispy Shallots'] },
  { q: 'easy curry', includes: ['Chickpea and Spinach Curry'] },
  { q: 'traybake', top: ['Harissa Chicken Traybake', 'Salmon Teriyaki Traybake'] },
  { q: 'chi', includes: ['Chicken Tikka Masala', 'Chickpea and Spinach Curry'] },
  { q: 'chiken', includes: ['Chicken Tikka Masala'] },
  { q: 'bao', first: ['Sticky Pork Belly Bao Buns with Quick-Pickled Cucumber and Crispy Shallots'] },
  { q: 'veggie', first: ['Veggie Chilli'] },
  { q: 'leek bacon tarragon', first: ['Creamy Leek and Bacon Pasta'], partial: true },
]

/** The pre-redesign matcher from hooks/use-recipe-filter.ts, kept for comparison. */
function legacySearch(recipes: SearchableRecipe[], query: string): string[] {
  const q = query.toLowerCase()
  return recipes
    .filter((r) => {
      const d = r.recipe_data
      return (
        r.title.toLowerCase().includes(q) ||
        (d.description ?? '').toLowerCase().includes(q) ||
        (d.tags ?? []).some((t) => t.toLowerCase().includes(q))
      )
    })
    .sort((a, b) => {
      const fav = Number(!!b.is_favorite) - Number(!!a.is_favorite)
      if (fav) return fav
      const t = (v?: string | null) => (v ? new Date(v).getTime() : 0)
      return t(b.last_opened_at) - t(a.last_opened_at) || t(b.created_at) - t(a.created_at)
    })
    .map((r) => r.title)
}

const legacy = process.argv.includes('--legacy')
const index = buildIndex(DEMO_RECIPES)

let passed = 0
for (const c of CASES) {
  const outcome = legacy ? null : searchRecipes(index, c.q)
  const titles = legacy ? legacySearch(DEMO_RECIPES, c.q) : outcome!.results.map((r) => r.recipe.title)
  const failures: string[] = []

  if (c.first && !c.first.includes(titles[0])) failures.push(`first was "${titles[0] ?? '(none)'}"`)
  if (c.top) {
    const within = titles.slice(0, c.within ?? c.top.length)
    for (const t of c.top) if (!within.includes(t)) failures.push(`"${t}" not in top ${within.length}`)
  }
  for (const t of c.includes ?? []) if (!titles.includes(t)) failures.push(`missing "${t}"`)
  for (const t of c.absent ?? []) if (titles.includes(t)) failures.push(`should not include "${t}"`)
  for (const [a, b] of c.above ?? []) {
    const ia = titles.indexOf(a)
    const ib = titles.indexOf(b)
    if (ia === -1 || (ib !== -1 && ia > ib)) failures.push(`"${a}" should rank above "${b}"`)
  }
  if (c.partial != null && outcome && outcome.partial !== c.partial) failures.push(`partial was ${outcome.partial}`)

  const ok = failures.length === 0
  if (ok) passed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${JSON.stringify(c.q).padEnd(24)} ${ok ? '' : failures.join('; ')}`)
  if (!ok) console.log(`      got: ${titles.slice(0, 5).join(' | ') || '(no results)'}`)
}

console.log(`\n${passed}/${CASES.length} passed${legacy ? ' (legacy matcher)' : ''}`)
process.exit(passed === CASES.length ? 0 : 1)
