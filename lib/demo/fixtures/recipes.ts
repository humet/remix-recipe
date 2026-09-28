import type { ImprovedRecipe, SavedRecipe } from '@/lib/recipe-types'
import { LIBRARY_RECIPES } from './library'

/**
 * Hand-authored sample recipes for demo mode. Ids are stable so deep links
 * like /recipe/demo-carbonara keep working across sessions.
 */

const carbonara: ImprovedRecipe = {
  title: 'Weeknight Carbonara',
  description:
    'Silky, peppery and on the table in twenty minutes. No cream — just eggs, hard cheese and a splash of starchy pasta water doing the work.',
  prepTime: '10 mins',
  cookTime: '15 mins',
  totalTime: '25 mins',
  servings: '4',
  difficulty: 'Medium',
  ingredients: [
    { name: 'spaghetti', amount: '400g', notes: 'or linguine' },
    { name: 'pancetta', amount: '150g', notes: 'cut into small cubes' },
    { name: 'egg yolks', amount: '4 large', notes: 'plus 1 whole egg' },
    { name: 'Pecorino Romano', amount: '60g', notes: 'finely grated' },
    { name: 'Parmesan', amount: '40g', notes: 'finely grated' },
    { name: 'black pepper', amount: '2 tsp', notes: 'coarsely cracked' },
    { name: 'salt', amount: 'to taste', notes: 'for the pasta water' },
  ],
  steps: [
    {
      stepNumber: 1,
      instruction:
        'Bring a large pan of well-salted water to the boil. Whisk the egg yolks, whole egg, both cheeses and the black pepper in a bowl until it forms a thick paste.',
      tips: 'Do this first — once the pasta is cooked you want to move fast.',
      timings: [{ label: 'Boil water', duration: '8 mins' }],
    },
    {
      stepNumber: 2,
      instruction:
        'Put the pancetta in a cold, dry frying pan and set over medium heat. Cook until the fat has rendered and the edges are crisp, then take off the heat.',
      tips: 'Starting cold renders the fat before the meat scorches.',
      timings: [{ label: 'Crisp the pancetta', duration: '7 mins' }],
    },
    {
      stepNumber: 3,
      instruction:
        'Cook the spaghetti until just shy of al dente. Reserve a large mug of pasta water before draining.',
      tips: null,
      timings: [{ label: 'Cook pasta', duration: '9 mins' }],
    },
    {
      stepNumber: 4,
      instruction:
        'Tip the drained pasta into the pancetta pan, off the heat. Toss to coat in the fat, then wait 30 seconds so the pan cools slightly.',
      tips: 'This pause is what stops the eggs scrambling.',
      timings: [{ label: 'Cool the pan', duration: '30 secs' }],
    },
    {
      stepNumber: 5,
      instruction:
        'Add the egg and cheese paste along with a splash of pasta water. Toss hard and continuously until glossy, loosening with more water as needed. Serve immediately with extra Pecorino and pepper.',
      tips: 'Keep it moving — the sauce thickens from the residual heat alone.',
    },
  ],
  proTips: [
    'Grate the cheese as finely as you can — coarse shreds refuse to melt smoothly.',
    'Pasta water is the emulsifier. Always keep more than you think you need.',
    'Warm the serving bowls; carbonara turns claggy the moment it cools.',
  ],
  improvements: [
    'Swapped cream for a yolk-heavy emulsion for a lighter, more authentic sauce',
    'Added a cold-pan start for the pancetta to render fat properly',
    'Built in a cooling pause before the eggs go in to prevent scrambling',
  ],
  tags: ['Italian', 'Pasta', 'Quick', 'Weeknight'],
}

const traybake: ImprovedRecipe = {
  title: 'Harissa Chicken Traybake',
  description:
    'One tray, one knife, almost no washing up. Harissa and honey caramelise around the chickpeas while the chicken skin crisps above them.',
  prepTime: '15 mins',
  cookTime: '40 mins',
  totalTime: '55 mins',
  servings: '4',
  difficulty: 'Easy',
  ingredients: [
    { name: 'chicken thighs', amount: '8 bone-in, skin-on', notes: null },
    { name: 'rose harissa', amount: '3 tbsp', notes: 'adjust to taste' },
    { name: 'runny honey', amount: '1 tbsp', notes: null },
    { name: 'chickpeas', amount: '1 x 400g tin', notes: 'drained and rinsed' },
    { name: 'red onions', amount: '2', notes: 'cut into thick wedges' },
    { name: 'cherry tomatoes', amount: '250g', notes: null },
    { name: 'olive oil', amount: '2 tbsp', notes: null },
    { name: 'lemon', amount: '1', notes: 'half juiced, half in wedges' },
    { name: 'flat-leaf parsley', amount: 'small bunch', notes: 'roughly chopped' },
  ],
  steps: [
    {
      stepNumber: 1,
      instruction:
        'Heat the oven to 200°C fan. Mix the harissa, honey, olive oil and lemon juice in a large bowl, then turn the chicken thighs through it until coated.',
      tips: 'Do this up to a day ahead and leave in the fridge — the flavour goes deeper.',
      timings: [{ label: 'Preheat oven', duration: '12 mins' }],
    },
    {
      stepNumber: 2,
      instruction:
        'Scatter the onions and chickpeas across a large roasting tray. Sit the chicken on top, skin-side up, and scrape over any remaining marinade.',
      tips: 'Keep the skin clear of the marinade pool so it can crisp.',
    },
    {
      stepNumber: 3,
      instruction: 'Roast for 25 minutes, until the skin is beginning to colour.',
      tips: null,
      timings: [{ label: 'First roast', duration: '25 mins' }],
    },
    {
      stepNumber: 4,
      instruction:
        'Add the cherry tomatoes to the tray and return to the oven for a further 15 minutes, until the chicken is cooked through and the tomatoes have burst.',
      tips: 'Chicken is done at 74°C in the thickest part of the thigh.',
      timings: [{ label: 'Second roast', duration: '15 mins' }],
    },
    {
      stepNumber: 5,
      instruction:
        'Rest for 5 minutes, then scatter with parsley and serve with the lemon wedges and the pan juices spooned over.',
      tips: null,
      timings: [{ label: 'Rest', duration: '5 mins' }],
    },
  ],
  proTips: [
    'Use the biggest tray that fits your oven — crowding steams the chicken instead of roasting it.',
    'Pat the skin dry with kitchen paper before marinating for a noticeably crisper finish.',
    'Leftovers are excellent cold, shredded through a grain salad.',
  ],
  improvements: [
    'Moved the tomatoes to a later stage so they burst rather than collapse',
    'Added chickpeas to make it a complete meal in one tray',
    'Introduced a rest before serving so the juices stay in the meat',
  ],
  tags: ['Traybake', 'One-pan', 'Chicken', 'Midweek', 'Meal prep'],
}

const dal: ImprovedRecipe = {
  title: 'Creamy Coconut Tarka Dal',
  description:
    'Red lentils cooked soft with coconut milk, finished with a hot spiced tarka poured over at the table. Cheap, vegan and deeply comforting.',
  prepTime: '10 mins',
  cookTime: '30 mins',
  totalTime: '40 mins',
  servings: '4',
  difficulty: 'Easy',
  ingredients: [
    { name: 'red split lentils', amount: '300g', notes: 'rinsed until the water runs clear' },
    { name: 'coconut milk', amount: '1 x 400ml tin', notes: 'full fat' },
    { name: 'ground turmeric', amount: '1 tsp', notes: null },
    { name: 'fresh ginger', amount: '30g', notes: 'grated' },
    { name: 'garlic', amount: '4 cloves', notes: 'sliced' },
    { name: 'coconut oil', amount: '2 tbsp', notes: 'for the tarka' },
    { name: 'cumin seeds', amount: '1 tsp', notes: null },
    { name: 'black mustard seeds', amount: '1 tsp', notes: null },
    { name: 'dried red chillies', amount: '2', notes: 'broken open' },
    { name: 'curry leaves', amount: '10', notes: 'fresh if you can find them' },
    { name: 'lime', amount: '1', notes: 'juiced' },
    { name: 'coriander', amount: 'small bunch', notes: 'chopped' },
  ],
  steps: [
    {
      stepNumber: 1,
      instruction:
        'Put the lentils, turmeric, ginger and 700ml water in a large pan. Bring to the boil, skim off any foam, then reduce to a simmer.',
      tips: 'Skimming the foam keeps the finished dal clean-tasting.',
      timings: [{ label: 'Bring to boil', duration: '6 mins' }],
    },
    {
      stepNumber: 2,
      instruction:
        'Simmer uncovered, stirring now and then, until the lentils have completely broken down.',
      tips: 'Add a splash more water if it tightens up before the lentils collapse.',
      timings: [{ label: 'Simmer lentils', duration: '20 mins' }],
    },
    {
      stepNumber: 3,
      instruction:
        'Stir in the coconut milk and season generously with salt. Simmer gently while you make the tarka.',
      tips: null,
      timings: [{ label: 'Enrich and season', duration: '5 mins' }],
    },
    {
      stepNumber: 4,
      instruction:
        'Heat the coconut oil in a small pan until shimmering. Add the mustard seeds and wait for them to pop, then add the cumin, chillies, curry leaves and garlic. Fry until the garlic is golden.',
      tips: 'Have a lid to hand — the mustard seeds jump.',
      timings: [{ label: 'Fry the tarka', duration: '2 mins' }],
    },
    {
      stepNumber: 5,
      instruction:
        'Pour the sizzling tarka straight over the dal. Add the lime juice, scatter with coriander and serve with rice or flatbread.',
      tips: 'Pour it over at the table — the sound is half the point.',
    },
  ],
  proTips: [
    'Rinse the lentils properly. Cloudy water means a gluey dal.',
    'Season only after the coconut milk goes in — salting early slows the lentils down.',
    'It thickens a lot in the fridge; loosen with hot water when reheating.',
  ],
  improvements: [
    'Added a proper tarka finish instead of frying the spices at the start',
    'Swapped in coconut milk for body without dairy',
    'Balanced the richness with lime juice added off the heat',
  ],
  tags: ['Vegan', 'Indian', 'Budget', 'Batch cook', 'Gluten-free'],
}

const cookies: ImprovedRecipe = {
  title: 'Brown Butter Chocolate Chip Cookies',
  description:
    'Browning the butter and resting the dough overnight turns an ordinary cookie into something toffee-ish, chewy in the middle and crisp at the edge.',
  prepTime: '20 mins',
  cookTime: '12 mins',
  totalTime: '12 hrs 32 mins',
  servings: '16 cookies',
  difficulty: 'Medium',
  ingredients: [
    { name: 'unsalted butter', amount: '225g', notes: null },
    { name: 'light brown sugar', amount: '200g', notes: null },
    { name: 'caster sugar', amount: '100g', notes: null },
    { name: 'eggs', amount: '2 large', notes: 'at room temperature' },
    { name: 'vanilla extract', amount: '2 tsp', notes: null },
    { name: 'plain flour', amount: '310g', notes: null },
    { name: 'bicarbonate of soda', amount: '1 tsp', notes: null },
    { name: 'fine sea salt', amount: '1 tsp', notes: null },
    { name: 'dark chocolate', amount: '250g', notes: '70%, roughly chopped into shards' },
    { name: 'flaky sea salt', amount: 'to finish', notes: null },
  ],
  steps: [
    {
      stepNumber: 1,
      instruction:
        'Melt the butter in a light-coloured pan over medium heat, swirling, until the milk solids turn amber and it smells nutty. Pour into a large bowl, scraping in every brown fleck, and leave to cool.',
      tips: 'It goes from nutty to burnt in seconds. Take it off the heat early.',
      timings: [
        { label: 'Brown the butter', duration: '6 mins' },
        { label: 'Cool the butter', duration: '20 mins' },
      ],
    },
    {
      stepNumber: 2,
      instruction:
        'Whisk both sugars into the cooled butter, then the eggs one at a time, then the vanilla. Keep whisking until the mixture is glossy and slightly paler.',
      tips: null,
      timings: [{ label: 'Whisk to glossy', duration: '3 mins' }],
    },
    {
      stepNumber: 3,
      instruction:
        'Fold in the flour, bicarbonate of soda and fine salt until just combined, then fold through the chocolate. Cover and refrigerate overnight.',
      tips: 'The rest is not optional — it hydrates the flour and deepens the flavour.',
      timings: [{ label: 'Rest the dough', duration: '12 hrs' }],
    },
    {
      stepNumber: 4,
      instruction:
        'Heat the oven to 180°C fan. Roll the dough into 16 balls and space them well apart on lined trays. Bake until the edges are set but the centres still look underdone.',
      tips: 'Pull them early. They finish setting on the tray.',
      timings: [{ label: 'Bake', duration: '12 mins' }],
    },
    {
      stepNumber: 5,
      instruction:
        'Sprinkle with flaky salt and leave on the tray for 10 minutes before moving to a rack.',
      tips: null,
      timings: [{ label: 'Set on the tray', duration: '10 mins' }],
    },
  ],
  proTips: [
    'Weigh the dough balls for cookies that bake evenly — around 55g each.',
    'Chopped chocolate beats chips: the shards create layers rather than dots.',
    'Freeze half the dough balls and bake from frozen, adding two minutes.',
  ],
  improvements: [
    'Browned the butter for a toffee note plain melted butter can’t give',
    'Added an overnight rest to hydrate the flour and improve chew',
    'Finished with flaky salt to sharpen the chocolate',
  ],
  tags: ['Baking', 'Dessert', 'Make ahead', 'Crowd-pleaser'],
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()
}

export const DEMO_RECIPES: SavedRecipe[] = [
  {
    id: 'demo-harissa-chicken-traybake',
    title: traybake.title,
    recipe_data: traybake,
    original_input:
      'Chicken thighs with harissa. Roast everything on a tray with onion and tomatoes for 40 mins.',
    created_at: daysAgo(2),
    updated_at: daysAgo(2),
    is_favorite: true,
    last_opened_at: daysAgo(1),
  },
  {
    id: 'demo-weeknight-carbonara',
    title: carbonara.title,
    recipe_data: carbonara,
    original_input:
      'Spaghetti carbonara — spaghetti, bacon, cream, egg, parmesan. Fry bacon, mix cream and egg, stir through hot pasta.',
    created_at: daysAgo(6),
    updated_at: daysAgo(6),
    is_favorite: true,
    last_opened_at: daysAgo(3),
  },
  {
    id: 'demo-coconut-tarka-dal',
    title: dal.title,
    recipe_data: dal,
    original_input:
      'Red lentil dal: lentils, turmeric, garlic, coconut milk. Boil until soft, season, serve with rice.',
    created_at: daysAgo(11),
    updated_at: daysAgo(11),
    is_favorite: false,
    last_opened_at: daysAgo(4),
  },
  {
    id: 'demo-brown-butter-cookies',
    title: cookies.title,
    recipe_data: cookies,
    original_input:
      'Chocolate chip cookies. Cream butter and sugar, add eggs, flour, chocolate chips. Bake 12 mins at 180.',
    created_at: daysAgo(19),
    updated_at: daysAgo(19),
    is_favorite: false,
    last_opened_at: null,
  },
  ...LIBRARY_RECIPES,
]

export const DEMO_RECIPE_BY_ID = new Map(DEMO_RECIPES.map((r) => [r.id, r]))
