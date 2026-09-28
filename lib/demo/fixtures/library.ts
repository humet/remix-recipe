import type { ImprovedRecipe, SavedRecipe } from '@/lib/recipe-types'

/**
 * A broader library of invented sample recipes for demo mode, so there is
 * enough variety to exercise search and filtering. Ids are stable
 * (`demo-<slug>`) so deep links keep working across sessions.
 *
 * Authored in a compact shorthand and expanded into full `SavedRecipe`
 * objects by `r()` below.
 */

/** [amount, name, notes?] */
type Ing = [amount: string, name: string, notes?: string]
/** [label, duration] */
type Timing = [label: string, duration: string]
type Step = string | { text: string; tip?: string; timings?: Timing[] }

interface Spec {
  slug: string
  created: number
  opened?: number
  favourite?: boolean
  input: string
  title: string
  description: string
  prep: string
  cook: string
  total: string
  servings: string
  difficulty: ImprovedRecipe['difficulty']
  ingredients: Ing[]
  steps: Step[]
  proTips: string[]
  improvements: string[]
  tags: string[]
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()
}

function r(spec: Spec): SavedRecipe {
  const recipe: ImprovedRecipe = {
    title: spec.title,
    description: spec.description,
    prepTime: spec.prep,
    cookTime: spec.cook,
    totalTime: spec.total,
    servings: spec.servings,
    difficulty: spec.difficulty,
    ingredients: spec.ingredients.map(([amount, name, notes]) => ({
      name,
      amount,
      notes: notes ?? null,
    })),
    steps: spec.steps.map((step, i) => {
      const s = typeof step === 'string' ? { text: step } : step
      return {
        stepNumber: i + 1,
        instruction: s.text,
        tips: s.tip ?? null,
        ...(s.timings
          ? { timings: s.timings.map(([label, duration]) => ({ label, duration })) }
          : {}),
      }
    }),
    proTips: spec.proTips,
    improvements: spec.improvements,
    tags: spec.tags,
  }

  return {
    id: `demo-${spec.slug}`,
    title: spec.title,
    recipe_data: recipe,
    original_input: spec.input,
    created_at: daysAgo(spec.created),
    updated_at: daysAgo(spec.created),
    is_favorite: spec.favourite ?? false,
    last_opened_at: spec.opened === undefined ? null : daysAgo(spec.opened),
  }
}

export const LIBRARY_RECIPES: SavedRecipe[] = [
  r({
    slug: 'chicken-tikka-masala',
    created: 34,
    opened: 2,
    favourite: true,
    input:
      'chicken tikka masala - chicken, yoghurt, spices, tin tomatoes, cream. marinade chicken, fry, add sauce, simmer 20 min',
    title: 'Chicken Tikka Masala',
    description:
      'Charred, yoghurt-marinated chicken in a rich, gently spiced tomato and cream sauce. Better than the takeaway, and most of the work is just waiting for the marinade.',
    prep: '20 mins',
    cook: '35 mins',
    total: '1 hr 25 mins',
    servings: '4',
    difficulty: 'Medium',
    ingredients: [
      ['800g', 'chicken thighs', 'boneless and skinless, cut into large chunks'],
      ['150g', 'natural yoghurt', 'full fat'],
      ['1 tbsp', 'garam masala', 'divided'],
      ['2 tsp', 'Kashmiri chilli powder', 'for colour more than heat'],
      ['2', 'onions', 'finely chopped'],
      ['4 cloves', 'garlic', 'grated'],
      ['1 x 400g tin', 'chopped tomatoes'],
      ['150ml', 'double cream'],
    ],
    steps: [
      {
        text: 'Mix the yoghurt, half the garam masala, the chilli powder and 1 tsp salt in a bowl. Turn the chicken through it until well coated, then leave to marinate.',
        tip: 'Overnight in the fridge is even better if you can plan ahead.',
        timings: [['Marinate', '30 mins']],
      },
      {
        text: 'Heat the grill to high. Spread the chicken over a lined tray and grill until charred at the edges but not quite cooked through.',
        tip: 'The char is where the tikka flavour comes from, so don’t be shy.',
        timings: [['Grill the chicken', '10 mins']],
      },
      {
        text: 'Meanwhile, fry the onions in a splash of oil until deep golden. Add the garlic and the remaining garam masala for a minute, then tip in the tomatoes and simmer until thick.',
        timings: [
          ['Soften the onions', '12 mins'],
          ['Simmer the sauce', '10 mins'],
        ],
      },
      {
        text: 'Blitz the sauce smooth if you like, then stir in the cream along with the chicken and any juices from the tray. Simmer gently until the chicken is cooked through.',
        timings: [['Finish in the sauce', '8 mins']],
      },
      'Season to taste and serve with basmati rice and warm naan.',
    ],
    proTips: [
      'Thighs stay juicy in the sauce where breast meat turns stringy.',
      'Add a pinch of garam masala right at the end for a fresher aroma.',
    ],
    improvements: [
      'Swapped chicken breast for thighs so the meat stays tender in the sauce',
      'Grilled the marinated chicken first for charred, smoky edges',
      'Held back some garam masala to add later for a brighter finish',
    ],
    tags: ['Indian', 'Curry'],
  }),

  r({
    slug: 'thai-green-curry-with-chicken',
    created: 58,
    input:
      'green curry. chicken, paste, coconut milk, veg. cook chicken add paste and milk simmer 15 mins serve w rice',
    title: 'Thai Green Curry with Chicken',
    description:
      'Fragrant, fiery and ready in about half an hour. Frying the paste in split coconut cream is the trick that makes a shop-bought jar taste homemade.',
    prep: '15 mins',
    cook: '20 mins',
    total: '35 mins',
    servings: '4',
    difficulty: 'Easy',
    ingredients: [
      ['600g', 'chicken thighs', 'boneless and skinless, sliced'],
      ['3 tbsp', 'green curry paste', 'shop-bought is fine'],
      ['1 x 400ml tin', 'coconut milk', 'full fat, unshaken'],
      ['1', 'aubergine', 'cut into bite-sized chunks'],
      ['100g', 'green beans', 'trimmed and halved'],
      ['1 tbsp', 'fish sauce'],
      ['1', 'lime', 'juiced'],
      ['handful', 'Thai basil', 'or regular basil'],
    ],
    steps: [
      {
        text: 'Spoon the thick cream from the top of the coconut milk into a wok. Bubble it over a high heat until it splits and the oil appears, then fry the curry paste in it.',
        tip: 'Splitting the cream lets the paste fry rather than stew, which is what makes it fragrant.',
        timings: [
          ['Split the coconut cream', '3 mins'],
          ['Fry the paste', '2 mins'],
        ],
      },
      {
        text: 'Add the chicken and turn it through the paste until sealed all over.',
        timings: [['Seal the chicken', '4 mins']],
      },
      {
        text: 'Pour in the rest of the coconut milk and a splash of water, add the aubergine and simmer until it is soft and the chicken is cooked.',
        timings: [['Simmer', '10 mins']],
      },
      {
        text: 'Add the green beans for the final few minutes. Season with the fish sauce and lime juice, then tear in the basil and serve with jasmine rice.',
        timings: [['Cook the beans', '4 mins']],
      },
    ],
    proTips: ['Taste the paste before you start — brands vary wildly in heat.'],
    improvements: [
      'Fried the curry paste in split coconut cream to bloom the aromatics',
      'Added aubergine to soak up the sauce and bulk out the curry',
      'Balanced the sauce with fish sauce and lime at the end',
    ],
    tags: ['Thai', 'Curry'],
  }),

  r({
    slug: 'leek-and-potato-soup',
    created: 96,
    input: 'leek & potato soup. leeks, potatoes, onion, stock. boil everything till soft and blend',
    title: 'Leek and Potato Soup',
    description:
      'Sweet, softly cooked leeks and floury potatoes blended into a velvety soup with no cream needed. Cheap, filling and endlessly reheatable.',
    prep: '15 mins',
    cook: '30 mins',
    total: '45 mins',
    servings: '4',
    difficulty: 'Easy',
    ingredients: [
      ['3', 'leeks', 'trimmed, washed and sliced'],
      ['500g', 'potatoes', 'floury, such as Maris Piper, peeled and diced'],
      ['1', 'onion', 'chopped'],
      ['40g', 'butter'],
      ['1.2 litres', 'vegetable stock', 'hot'],
      ['100ml', 'whole milk'],
      ['small bunch', 'chives', 'snipped, to serve'],
    ],
    steps: [
      {
        text: 'Melt the butter in a large pan. Add the leeks and onion with a pinch of salt, cover and sweat gently until soft but not coloured.',
        tip: 'The lid traps the steam so the leeks soften and sweeten without browning.',
        timings: [['Sweat the leeks', '12 mins']],
      },
      {
        text: 'Add the potatoes and hot stock. Simmer until the potatoes break apart when pressed against the side of the pan.',
        timings: [['Simmer', '20 mins']],
      },
      {
        text: 'Blend until completely smooth, then stir in the milk and season generously.',
        tip: 'Blend in batches and don’t overfill the jug — hot liquid expands.',
      },
      'Serve scattered with chives and plenty of black pepper, with buttered bread alongside.',
    ],
    proTips: ['Wash the leeks after slicing — grit hides between the layers.'],
    improvements: [
      'Sweated the leeks under a lid for a sweeter, silkier base',
      'Used floury potatoes so the soup thickens without cream',
    ],
    tags: ['Soup', 'Vegetarian', 'Budget'],
  }),

  r({
    slug: 'creamy-leek-and-bacon-pasta',
    created: 8,
    opened: 1,
    favourite: true,
    input: 'leek bacon pasta. fry bacon and leeks, add creme fraiche, mix w pasta. quick one',
    title: 'Creamy Leek and Bacon Pasta',
    description:
      'Smoky bacon and soft, sweet leeks folded through penne with crème fraîche. A proper store-cupboard supper that’s on the table in twenty-five minutes.',
    prep: '10 mins',
    cook: '15 mins',
    total: '25 mins',
    servings: '4',
    difficulty: 'Easy',
    ingredients: [
      ['350g', 'penne'],
      ['200g', 'smoked bacon', 'lardons, or rashers cut into strips'],
      ['2', 'leeks', 'halved lengthways, washed and sliced'],
      ['1 clove', 'garlic', 'crushed'],
      ['200ml', 'crème fraîche', 'full fat'],
      ['40g', 'Parmesan', 'finely grated'],
    ],
    steps: [
      {
        text: 'Cook the penne in a large pan of well-salted boiling water until al dente.',
        timings: [['Cook pasta', '11 mins']],
      },
      {
        text: 'Meanwhile, fry the bacon in a dry frying pan until crisp and the fat has rendered. Add the leeks with a pinch of salt and cook until soft and sweet.',
        tip: 'The leeks will release water at first — let it cook off before moving on.',
        timings: [
          ['Crisp the bacon', '5 mins'],
          ['Soften the leeks', '8 mins'],
        ],
      },
      'Stir in the garlic for a minute, then add the crème fraîche and a ladle of pasta water to make a loose, glossy sauce.',
      'Toss the drained penne through the sauce with the Parmesan and lots of black pepper. Serve straight away.',
    ],
    proTips: ['Keep a mug of pasta water back — the sauce tightens quickly as it sits.'],
    improvements: [
      'Cooked the leeks in the rendered bacon fat for extra depth',
      'Loosened the crème fraîche with pasta water so it coats rather than clumps',
    ],
    tags: ['Pasta', 'Quick'],
  }),

  r({
    slug: 'crispy-smashed-potatoes',
    created: 15,
    opened: 0,
    favourite: true,
    input: 'smashed potatoes. boil baby potatoes, squash, oil garlic rosemary, roast 220 till crispy',
    title: 'Crispy Smashed Potatoes',
    description:
      'Boiled, squashed flat and roasted hard until the edges shatter. The side dish that quietly steals the show from the Sunday roast chicken.',
    prep: '10 mins',
    cook: '50 mins',
    total: '1 hr',
    servings: '4',
    difficulty: 'Easy',
    ingredients: [
      ['1kg', 'potatoes', 'small waxy or new potatoes'],
      ['4 tbsp', 'olive oil'],
      ['4 cloves', 'garlic', 'lightly crushed, skin on'],
      ['3 sprigs', 'rosemary', 'leaves picked'],
      ['to finish', 'flaky sea salt'],
    ],
    steps: [
      {
        text: 'Heat the oven to 220°C fan. Boil the potatoes in well-salted water until a knife slides in easily.',
        timings: [['Boil potatoes', '18 mins']],
      },
      {
        text: 'Drain and leave them to steam dry in the colander.',
        tip: 'Dry surfaces crisp; wet ones steam. Don’t skip this.',
        timings: [['Steam dry', '5 mins']],
      },
      'Oil a large roasting tray and spread out the potatoes. Press each one flat with the base of a mug until the skin splits, then drizzle with the rest of the oil and tuck in the garlic.',
      {
        text: 'Roast until the undersides are golden, then scatter over the rosemary and return to the oven until deeply crisp all over.',
        timings: [
          ['Roast', '25 mins'],
          ['Crisp with rosemary', '8 mins'],
        ],
      },
      'Squeeze the soft garlic out of its skins over the potatoes and finish with flaky salt.',
    ],
    proTips: ['Give them space on the tray — crowded potatoes never crisp properly.'],
    improvements: [
      'Added a steam-dry step so the potatoes crisp rather than stew',
      'Held back the rosemary until late so it doesn’t burn',
    ],
    tags: ['Side', 'Vegetarian'],
  }),

  r({
    slug: 'veggie-chilli',
    created: 41,
    opened: 9,
    input: 'veggie chilli - beans, peppers, tomatoes, spices. cook for 30 min',
    title: 'Veggie Chilli',
    description:
      'A smoky, hearty pot of beans and sweet potato that committed meat-eaters go back to for seconds. Freezes brilliantly.',
    prep: '15 mins',
    cook: '40 mins',
    total: '55 mins',
    servings: '6',
    difficulty: 'Easy',
    ingredients: [
      ['1', 'onion', 'chopped'],
      ['2', 'peppers', 'red and yellow, diced'],
      ['1 large', 'sweet potato', 'peeled and cut into 2cm cubes'],
      ['2 tsp', 'smoked paprika'],
      ['2 tsp', 'ground cumin'],
      ['2 x 400g tins', 'chopped tomatoes'],
      ['2 x 400g tins', 'kidney beans', 'drained and rinsed'],
      ['10g', 'dark chocolate', 'optional, but worth it'],
    ],
    steps: [
      {
        text: 'Fry the onion and peppers in a splash of oil in a large pan until soft.',
        timings: [['Soften the veg', '8 mins']],
      },
      {
        text: 'Stir in the paprika and cumin for a minute, then add the tomatoes, sweet potato and a splash of water. Cover and simmer.',
        timings: [['Simmer covered', '20 mins']],
      },
      {
        text: 'Add the kidney beans and simmer uncovered until thick and the sweet potato is tender.',
        tip: 'Crush a few beans against the side of the pan to thicken the chilli naturally.',
        timings: [['Simmer uncovered', '15 mins']],
      },
      'Stir in the chocolate, season well and serve with rice, soured cream and lime wedges.',
    ],
    proTips: ['It tastes even better the next day, so make a double batch.'],
    improvements: [
      'Added sweet potato for body and a little sweetness',
      'Finished with a square of dark chocolate to round out the tomatoes',
    ],
    tags: ['Vegetarian', 'One-pot'],
  }),

  r({
    slug: 'shakshuka',
    created: 22,
    opened: 3,
    favourite: true,
    input: 'shakshuka. peppers onion tomatoes cumin, crack eggs in, cover til set',
    title: 'Shakshuka',
    description:
      'Eggs gently poached in a sweet, cumin-spiced pepper and tomato sauce, served straight from the pan. Brunch for two with barely any washing up.',
    prep: '10 mins',
    cook: '25 mins',
    total: '35 mins',
    servings: '2',
    difficulty: 'Easy',
    ingredients: [
      ['2 tbsp', 'olive oil'],
      ['1', 'onion', 'thinly sliced'],
      ['2', 'red peppers', 'thinly sliced'],
      ['2 cloves', 'garlic', 'sliced'],
      ['2 tsp', 'ground cumin'],
      ['1 x 400g tin', 'chopped tomatoes'],
      ['4', 'eggs'],
      ['small bunch', 'flat-leaf parsley', 'roughly chopped'],
    ],
    steps: [
      {
        text: 'Heat the oil in a large frying pan with a lid. Cook the onion and peppers until soft and sweet.',
        timings: [['Soften the peppers', '10 mins']],
      },
      {
        text: 'Add the garlic and cumin for a minute, then the tomatoes. Simmer until thick.',
        tip: 'It should be thick enough to hold a well when you drag a spoon through it.',
        timings: [['Simmer the sauce', '8 mins']],
      },
      {
        text: 'Make four wells in the sauce and crack an egg into each. Cover and cook until the whites are set but the yolks are still runny.',
        tip: 'The lid is key — it sets the tops of the whites without overcooking the yolks.',
        timings: [['Cook the eggs', '6 mins']],
      },
      'Scatter with parsley and serve straight from the pan with crusty bread.',
    ],
    proTips: ['A spoonful of harissa stirred into the sauce adds a welcome kick.'],
    improvements: [
      'Cooked the peppers down for longer for a sweeter, jammier base',
      'Covered the pan so the whites set before the yolks overcook',
    ],
    tags: ['Vegetarian', 'Brunch', 'One pot'],
  }),

  r({
    slug: 'egg-fried-rice',
    created: 27,
    opened: 5,
    favourite: true,
    input: 'egg fried rice - leftover rice, eggs, peas, soy. fry it all up',
    title: 'Egg Fried Rice',
    description:
      'The best thing you can do with last night’s leftover rice. Hot wok, soft curds of egg, sweet peas and a slick of soy — done in fifteen minutes.',
    prep: '5 mins',
    cook: '10 mins',
    total: '15 mins',
    servings: '2',
    difficulty: 'Easy',
    ingredients: [
      ['500g', 'cooked rice', 'cold, ideally a day old'],
      ['3', 'eggs', 'beaten'],
      ['100g', 'peas', 'frozen'],
      ['4', 'spring onions', 'sliced, whites and greens kept separate'],
      ['2 tbsp', 'soy sauce', 'light'],
      ['1 tsp', 'sesame oil'],
      ['2 tbsp', 'vegetable oil'],
    ],
    steps: [
      {
        text: 'Heat the vegetable oil in a wok until smoking. Add the spring onion whites and peas and stir-fry briefly.',
        timings: [['Fry peas', '1 min']],
      },
      {
        text: 'Push everything to one side, pour in the eggs and scramble softly until just set.',
        timings: [['Scramble eggs', '1 min']],
      },
      {
        text: 'Add the rice, pressing out any clumps, and toss over a high heat until piping hot and lightly toasted.',
        tip: 'Cold rice fries; warm rice turns to mush.',
        timings: [['Fry the rice', '4 mins']],
      },
      'Add the soy sauce and sesame oil, toss well and finish with the spring onion greens.',
    ],
    proTips: ['Cook the rice the day before and spread it on a tray to cool quickly before chilling.'],
    improvements: [
      'Switched to day-old rice so the grains stay separate',
      'Scrambled the eggs in the wok first for bigger, softer curds',
    ],
    tags: ['Chinese', 'Quick'],
  }),

  r({
    slug: 'aubergine-parmigiana',
    created: 73,
    input:
      'aubergine parmigiana - fry aubergine slices, layer with tomato sauce and mozzarella, bake 30 mins',
    title: 'Aubergine Parmigiana',
    description:
      'Layers of silky roasted aubergine, rich tomato sauce, basil and melting mozzarella baked until bubbling. Roasting rather than frying keeps it lighter without losing any comfort.',
    prep: '25 mins',
    cook: '1 hr',
    total: '1 hr 25 mins',
    servings: '4',
    difficulty: 'Medium',
    ingredients: [
      ['3', 'aubergines', 'sliced lengthways 1cm thick'],
      ['5 tbsp', 'olive oil'],
      ['2 cloves', 'garlic', 'sliced'],
      ['2 x 400g tins', 'plum tomatoes'],
      ['2 x 125g balls', 'mozzarella', 'torn and patted dry'],
      ['50g', 'Parmesan', 'finely grated'],
      ['large bunch', 'basil', 'leaves picked'],
    ],
    steps: [
      {
        text: 'Heat the oven to 200°C fan. Brush the aubergine slices with most of the oil and roast on lined trays until soft and golden.',
        tip: 'Roasting uses a fraction of the oil that frying soaks up.',
        timings: [['Roast the aubergines', '25 mins']],
      },
      {
        text: 'Meanwhile, cook the garlic gently in the remaining oil, add the tomatoes and crush them with a spoon. Simmer to a thick sauce, then season and stir in half the basil.',
        timings: [['Simmer the sauce', '20 mins']],
      },
      'In a baking dish, layer sauce, aubergine, mozzarella, basil and a little Parmesan. Repeat, finishing with sauce and a generous layer of Parmesan.',
      {
        text: 'Bake until bubbling and golden, then rest before serving.',
        tip: 'Resting lets the layers set so it slices cleanly.',
        timings: [
          ['Bake', '30 mins'],
          ['Rest', '10 mins'],
        ],
      },
    ],
    proTips: ['Make it a day ahead — the flavours settle and it reheats beautifully.'],
    improvements: [
      'Roasted the aubergine slices instead of frying for a lighter dish',
      'Patted the mozzarella dry so the layers don’t go watery',
    ],
    tags: ['Italian', 'Vegetarian'],
  }),

  r({
    slug: 'courgette-and-feta-fritters',
    created: 49,
    input: 'courgette fritters w feta. grate courgette, mix egg flour feta, fry spoonfuls',
    title: 'Courgette and Feta Fritters',
    description:
      'Crisp-edged courgette fritters flecked with salty feta and fresh dill. Squeezing the courgettes dry is the difference between golden and soggy.',
    prep: '15 mins',
    cook: '15 mins',
    total: '30 mins',
    servings: '4',
    difficulty: 'Easy',
    ingredients: [
      ['2', 'courgettes', 'coarsely grated'],
      ['100g', 'feta', 'crumbled'],
      ['2', 'eggs', 'beaten'],
      ['60g', 'plain flour'],
      ['small bunch', 'dill', 'chopped'],
      ['2', 'spring onions', 'finely sliced'],
      ['1', 'lemon', 'zested, then cut into wedges'],
      ['3 tbsp', 'olive oil', 'for frying'],
    ],
    steps: [
      {
        text: 'Toss the grated courgette with half a teaspoon of salt in a sieve and leave to drain. Then squeeze out as much liquid as you can in a clean tea towel.',
        tip: 'This is the step that decides crisp versus soggy.',
        timings: [['Salt and drain', '10 mins']],
      },
      'Mix the courgette with the eggs, flour, feta, dill, spring onions, lemon zest and plenty of black pepper. Go easy on extra salt — the feta brings plenty.',
      {
        text: 'Heat the oil in a frying pan. Drop in heaped tablespoons of the mixture, flatten slightly and fry in batches until golden on both sides.',
        timings: [['Fry each batch', '6 mins']],
      },
      'Drain on kitchen paper and serve warm with Greek yoghurt and the lemon wedges.',
    ],
    proTips: ['Keep finished fritters warm in a low oven while you fry the rest.'],
    improvements: [
      'Salted and squeezed the courgettes to stop the fritters going soggy',
      'Added lemon zest and dill for freshness against the salty feta',
    ],
    tags: ['Vegetarian', 'Brunch'],
  }),

  r({
    slug: 'jalapeno-cornbread',
    created: 104,
    input:
      'cornbread w jalapeños. cornmeal flour baking powder buttermilk eggs butter. bake 25 min at 200',
    title: 'Jalapeño Cornbread',
    description:
      'Tender, golden cornbread with pockets of fresh chilli heat and a cheesy crust. Baked in a hot buttered tin so the edges come out crisp.',
    prep: '10 mins',
    cook: '25 mins',
    total: '35 mins',
    servings: '9 squares',
    difficulty: 'Easy',
    ingredients: [
      ['200g', 'cornmeal', 'or fine polenta'],
      ['125g', 'plain flour'],
      ['1 tbsp', 'baking powder'],
      ['300ml', 'buttermilk'],
      ['2', 'eggs'],
      ['75g', 'unsalted butter', 'melted, plus extra for the tin'],
      ['2', 'jalapeños', 'deseeded and finely chopped'],
      ['100g', 'mature Cheddar', 'grated'],
    ],
    steps: [
      {
        text: 'Heat the oven to 200°C fan with a 20cm cast-iron pan or square tin inside, a knob of butter in the bottom.',
        tip: 'A hot tin gives you a crisp, golden crust.',
        timings: [['Heat the tin', '10 mins']],
      },
      'Whisk the cornmeal, flour, baking powder and 1 tsp salt in a bowl. In a jug, whisk the buttermilk, eggs and melted butter. Fold the wet into the dry until just combined, then fold in the jalapeños and most of the cheese.',
      {
        text: 'Pour into the hot tin, scatter over the remaining cheese and bake until golden and a skewer comes out clean.',
        timings: [['Bake', '22 mins']],
      },
      {
        text: 'Leave to cool slightly in the tin before cutting into squares.',
        timings: [['Cool', '10 mins']],
      },
    ],
    proTips: ['Leave a few seeds in the jalapeños if you like more heat.'],
    improvements: [
      'Preheated the tin with butter for a crisp, golden crust',
      'Added mature Cheddar to temper the heat of the chillies',
    ],
    tags: ['Baking', 'Side'],
  }),

  r({
    slug: 'classic-beef-lasagne',
    created: 88,
    input:
      'lasagne - mince, onion, tomatoes, lasagne sheets, white sauce, cheese. layer and bake 40 mins',
    title: 'Classic Beef Lasagne',
    description:
      'A slow-simmered beef ragù layered with silky béchamel and baked until deeply golden. A weekend job, but it feeds a crowd and tastes even better the next day.',
    prep: '20 mins',
    cook: '1 hr 40 mins',
    total: '2 hrs',
    servings: '6',
    difficulty: 'Hard',
    ingredients: [
      ['750g', 'beef mince', '15% fat'],
      ['1', 'onion', 'finely chopped'],
      ['150ml', 'red wine'],
      ['2 x 400g tins', 'chopped tomatoes'],
      ['2 tbsp', 'tomato purée'],
      ['250g', 'dried lasagne sheets'],
      ['750ml', 'béchamel sauce', 'made with 60g butter, 60g plain flour and 750ml whole milk'],
      ['75g', 'Parmesan', 'finely grated'],
    ],
    steps: [
      {
        text: 'Brown the mince in batches in a hot, wide pan until deeply coloured, then set aside. Soften the onion in the fat left behind.',
        tip: 'Don’t crowd the pan, or the mince steams grey instead of browning.',
        timings: [
          ['Brown the mince', '10 mins'],
          ['Soften the onion', '8 mins'],
        ],
      },
      {
        text: 'Return the mince, stir in the tomato purée, then pour in the wine and let it bubble. Add the tomatoes and half a tin of water, then simmer gently until thick and rich.',
        timings: [
          ['Reduce the wine', '2 mins'],
          ['Simmer the ragù', '30 mins'],
        ],
      },
      {
        text: 'While the ragù simmers, make the béchamel: melt the butter, stir in the flour for a minute, then gradually whisk in the milk and simmer until thick. Season with salt and a grating of nutmeg.',
        tip: 'Warm the milk first and you’ll get fewer lumps.',
        timings: [['Make the béchamel', '8 mins']],
      },
      'Heat the oven to 180°C fan. Layer ragù, lasagne sheets and béchamel in a deep dish, three times over, finishing with béchamel and the Parmesan.',
      {
        text: 'Bake until bubbling and deep golden, then rest before cutting.',
        tip: 'The rest is what gives you clean, tidy slices.',
        timings: [
          ['Bake', '40 mins'],
          ['Rest', '15 mins'],
        ],
      },
    ],
    proTips: [
      'Assemble a day ahead and chill — add 10 minutes to the baking time from cold.',
    ],
    improvements: [
      'Browned the mince in batches for a deeper, meatier ragù',
      'Seasoned the béchamel with nutmeg for a more rounded sauce',
      'Added a proper rest after baking so the lasagne slices cleanly',
    ],
    tags: ['Italian', 'Pasta', 'Make ahead'],
  }),

  r({
    slug: 'spaghetti-bolognese',
    created: 115,
    input: 'spag bol. mince, onion, tin tomatoes, garlic, pasta. brown mince add tomatoes simmer',
    title: 'Spaghetti Bolognese',
    description:
      'A rich, tender beef and tomato sauce built on a slow-cooked base of onion, carrot and celery. Weeknight-friendly, with a splash of milk doing quiet work in the background.',
    prep: '15 mins',
    cook: '40 mins',
    total: '55 mins',
    servings: '4',
    difficulty: 'Medium',
    ingredients: [
      ['500g', 'beef mince'],
      ['1', 'onion', 'finely chopped'],
      ['2', 'carrots', 'finely diced'],
      ['2 sticks', 'celery', 'finely diced'],
      ['2 tbsp', 'tomato purée'],
      ['1 x 400g tin', 'chopped tomatoes'],
      ['100ml', 'whole milk'],
      ['400g', 'spaghetti'],
    ],
    steps: [
      {
        text: 'Cook the onion, carrots and celery gently in a little olive oil until soft and sweet.',
        tip: 'A small dice melts into the sauce, so the fussy eaters never notice the veg.',
        timings: [['Soften the soffritto', '10 mins']],
      },
      {
        text: 'Turn up the heat, add the mince and break it up with a wooden spoon. Cook until browned all over.',
        timings: [['Brown the mince', '8 mins']],
      },
      {
        text: 'Stir in the tomato purée, then the tomatoes and milk. Simmer, partly covered, stirring now and then.',
        tip: 'The milk softens the acidity of the tomatoes and keeps the meat tender.',
        timings: [['Simmer the sauce', '30 mins']],
      },
      {
        text: 'Cook the spaghetti until al dente, then toss with the sauce and a splash of pasta water. Serve with grated Parmesan.',
        timings: [['Cook pasta', '10 mins']],
      },
    ],
    proTips: ['If you have time, let the sauce go for an hour — it only gets better.'],
    improvements: [
      'Added carrot and celery for a proper soffritto base',
      'Stirred in milk to mellow the tomatoes and tenderise the mince',
    ],
    tags: ['Italian', 'Pasta', 'Weeknight'],
  }),

  r({
    slug: 'sticky-pork-belly-bao-buns',
    created: 64,
    input:
      'pork belly bao. roast pork belly w hoisin, pickled cucumber, fried shallots, steam buns. takes ages but worth it',
    title: 'Sticky Pork Belly Bao Buns with Quick-Pickled Cucumber and Crispy Shallots',
    description:
      'Slow-braised pork belly glazed until sticky, tucked into soft steamed buns with sharp pickled cucumber and crunchy shallots. A proper project, and every bit worth it.',
    prep: '40 mins',
    cook: '2 hrs',
    total: '2 hrs 40 mins',
    servings: '4 (makes 12 buns)',
    difficulty: 'Hard',
    ingredients: [
      ['800g', 'pork belly', 'skin removed, cut into 3cm pieces'],
      ['5 tbsp', 'hoisin sauce', 'divided'],
      ['2 tbsp', 'dark soy sauce'],
      ['12', 'bao buns', 'frozen'],
      ['1', 'cucumber', 'thinly sliced'],
      ['4 tbsp', 'rice vinegar', 'with 1 tsp caster sugar and a pinch of salt'],
      ['3', 'banana shallots', 'thinly sliced into rings'],
      ['200ml', 'vegetable oil', 'for frying'],
    ],
    steps: [
      {
        text: 'Heat the oven to 160°C fan. Put the pork in a snug roasting tin with the soy sauce, half the hoisin and 250ml water. Cover tightly with foil and cook until yielding.',
        timings: [['Slow roast', '1 hr 30 mins']],
      },
      {
        text: 'Meanwhile, stir the sugar and salt into the vinegar and pour over the cucumber. For the shallots, put them in a small pan with the cold oil, then heat and fry, stirring, until golden. Drain on kitchen paper.',
        tip: 'Pull the shallots at light gold — they keep darkening as they drain.',
        timings: [
          ['Pickle the cucumber', '30 mins'],
          ['Fry the shallots', '12 mins'],
        ],
      },
      {
        text: 'Uncover the pork and turn the oven up to 200°C fan. Brush with the remaining hoisin and a little of the cooking liquid, then roast until sticky and caramelised, basting once or twice.',
        timings: [['Glaze', '25 mins']],
      },
      {
        text: 'Steam the bao buns until soft and puffed. Fill each with pork, a few slices of cucumber, a pinch of crispy shallots and a spoonful of the sticky glaze.',
        timings: [['Steam the buns', '8 mins']],
      },
    ],
    proTips: [
      'The pork can be braised a day ahead and glazed just before serving.',
      'Save the shallot oil — it’s brilliant in noodle dressings.',
    ],
    improvements: [
      'Braised the pork belly low and slow before glazing so it’s tender, not chewy',
      'Added a quick pickle to cut through the richness',
      'Fried the shallots from cold for even, crisp results',
    ],
    tags: ['Chinese', 'Weekend project'],
  }),

  r({
    slug: 'lemon-drizzle-cake',
    created: 38,
    opened: 7,
    favourite: true,
    input: 'lemon drizzle - butter sugar eggs flour lemon. bake 45 mins pour lemon + sugar over',
    title: 'Lemon Drizzle Cake',
    description:
      'A tender, buttery loaf soaked in sharp lemon syrup that sets into a crackly sugar crust. The cake everyone asks you to bring again.',
    prep: '15 mins',
    cook: '45 mins',
    total: '1 hr 30 mins',
    servings: '10 slices',
    difficulty: 'Easy',
    ingredients: [
      ['225g', 'unsalted butter', 'softened'],
      ['225g', 'caster sugar'],
      ['4', 'eggs', 'at room temperature'],
      ['225g', 'self-raising flour'],
      ['2', 'lemons', 'zested and juiced'],
      ['2 tbsp', 'milk'],
      ['100g', 'granulated sugar', 'for the drizzle'],
    ],
    steps: [
      {
        text: 'Heat the oven to 160°C fan and line a 900g loaf tin. Beat the butter and caster sugar until pale and fluffy.',
        timings: [['Cream butter and sugar', '4 mins']],
      },
      'Beat in the eggs one at a time, then fold in the flour, lemon zest and milk until smooth.',
      {
        text: 'Scrape into the tin and bake until risen and a skewer comes out clean.',
        timings: [['Bake', '45 mins']],
      },
      {
        text: 'Mix the lemon juice with the granulated sugar. Prick the hot cake all over with a skewer and pour the drizzle over while it’s still in the tin. Leave to cool completely before lifting out.',
        tip: 'Granulated sugar, not icing sugar — it’s what gives the crunchy top.',
        timings: [['Cool in the tin', '30 mins']],
      },
    ],
    proTips: ['Wrapped well, it stays moist for up to four days.'],
    improvements: [
      'Used granulated sugar in the drizzle for a crunchy, crackly top',
      'Poured the drizzle over while the cake is hot so it soaks right through',
    ],
    tags: ['Baking', 'Dessert'],
  }),

  r({
    slug: 'apple-and-blackberry-crumble',
    created: 81,
    input:
      'apple and blackberry crumble. apples blackberries sugar, crumble = flour butter sugar. 40 mins',
    title: 'Apple and Blackberry Crumble',
    description:
      'Tart Bramley apples and jammy blackberries under a buttery, almond-rich crumble. Made from cheap, cupboard-friendly ingredients and at its best with hot custard.',
    prep: '20 mins',
    cook: '40 mins',
    total: '1 hr',
    servings: '6',
    difficulty: 'Easy',
    ingredients: [
      ['4', 'Bramley apples', 'peeled, cored and chopped'],
      ['250g', 'blackberries', 'fresh or frozen'],
      ['50g', 'caster sugar'],
      ['½ tsp', 'ground cinnamon'],
      ['200g', 'plain flour'],
      ['120g', 'unsalted butter', 'cold and cubed'],
      ['100g', 'demerara sugar'],
      ['50g', 'ground almonds'],
    ],
    steps: [
      'Heat the oven to 180°C fan. Toss the apples and blackberries with the caster sugar and cinnamon in a baking dish.',
      {
        text: 'Rub the butter into the flour until it looks like breadcrumbs, then stir in the demerara and ground almonds.',
        tip: 'Stop while there are still a few pea-sized lumps — they make the top crunchier.',
      },
      {
        text: 'Scatter the crumble over the fruit without pressing down, then bake until golden and the fruit is bubbling up at the edges.',
        timings: [['Bake', '40 mins']],
      },
      {
        text: 'Leave to settle before serving with custard or cream.',
        timings: [['Rest', '10 mins']],
      },
    ],
    proTips: ['Make the crumble topping in bulk and freeze it — it bakes straight from frozen.'],
    improvements: [
      'Added ground almonds to the topping for a richer, nuttier crunch',
      'Left the crumble loose rather than pressed down so it bakes crisp',
    ],
    tags: ['Dessert', 'Budget'],
  }),

  r({
    slug: 'key-lime-pie',
    created: 110,
    input:
      'key lime pie - biscuit base, condensed milk, lime juice, egg yolks, cream on top. chill overnight',
    title: 'Key Lime Pie',
    description:
      'A sharp, silky lime filling on a buttery biscuit base, topped with softly whipped cream. Make it the day before and it slices beautifully.',
    prep: '25 mins',
    cook: '25 mins',
    total: '4 hrs 50 mins',
    servings: '8',
    difficulty: 'Medium',
    ingredients: [
      ['250g', 'digestive biscuits'],
      ['100g', 'unsalted butter', 'melted'],
      ['1 x 397g tin', 'sweetened condensed milk'],
      ['3', 'egg yolks'],
      ['5', 'limes', 'zested and juiced (about 150ml)'],
      ['300ml', 'double cream'],
      ['1 tbsp', 'icing sugar'],
    ],
    steps: [
      {
        text: 'Heat the oven to 160°C fan. Blitz the biscuits to crumbs, mix with the melted butter and press firmly into a 23cm tart tin. Bake until lightly golden.',
        timings: [['Bake the base', '10 mins']],
      },
      'Whisk the egg yolks with most of the lime zest, then whisk in the condensed milk and finally the lime juice. It will thicken as you go.',
      {
        text: 'Pour onto the base and bake until just set with a slight wobble in the centre.',
        tip: 'It firms up a lot as it chills, so don’t bake it until solid.',
        timings: [['Bake the filling', '15 mins']],
      },
      {
        text: 'Cool to room temperature, then chill until firm.',
        timings: [['Chill', '4 hrs']],
      },
      'Whip the cream with the icing sugar to soft peaks, spread over the pie and finish with the remaining zest.',
    ],
    proTips: ['Regular limes work perfectly — you don’t need to hunt down key limes.'],
    improvements: [
      'Baked the filling briefly for a firmer set and cleaner slices',
      'Saved some lime zest for the top to lift the aroma',
    ],
    tags: ['Dessert', 'Make ahead'],
  }),

  r({
    slug: 'ginger-beef-stir-fry',
    created: 18,
    input: 'ginger beef - beef strips, ginger, garlic, broccoli, soy. stir fry. serve w rice',
    title: 'Ginger Beef Stir-Fry',
    description:
      'Seared beef, crisp greens and a glossy sauce built on a thumb-sized piece of ginger. Faster than the takeaway and a lot fresher.',
    prep: '12 mins',
    cook: '8 mins',
    total: '20 mins',
    servings: '2',
    difficulty: 'Easy',
    ingredients: [
      ['300g', 'beef sirloin', 'trimmed and thinly sliced against the grain'],
      ['1 tbsp', 'cornflour'],
      ['1 thumb-sized piece', 'fresh ginger', 'peeled and cut into matchsticks'],
      ['2 cloves', 'garlic', 'thinly sliced'],
      ['200g', 'tenderstem broccoli', 'halved lengthways if thick'],
      ['3 tbsp', 'soy sauce', 'divided'],
      ['1 tbsp', 'oyster sauce'],
      ['4', 'spring onions', 'cut into 3cm lengths'],
    ],
    steps: [
      {
        text: 'Toss the beef with the cornflour and 1 tbsp of the soy sauce. Leave while you prepare everything else.',
        tip: 'The cornflour coating keeps the beef tender and helps the sauce cling.',
        timings: [['Marinate', '10 mins']],
      },
      {
        text: 'Heat a wok with a splash of oil until smoking. Sear the beef in a single layer for about a minute each side, then lift out.',
        tip: 'Work in two batches if your wok is small.',
        timings: [['Sear the beef', '2 mins']],
      },
      {
        text: 'Add the broccoli and a splash of water and stir-fry until bright green. Add the ginger and garlic for 30 seconds.',
        timings: [['Stir-fry the greens', '3 mins']],
      },
      'Return the beef with the remaining soy and the oyster sauce, toss until glossy, then add the spring onions. Serve straight away with steamed rice.',
    ],
    proTips: ['Put the steak in the freezer for 20 minutes first — it makes thin slicing much easier.'],
    improvements: [
      'Coated the beef in cornflour so it stays tender and the sauce clings',
      'Seared the beef separately to stop it stewing in the wok',
    ],
    tags: ['Chinese', 'Quick'],
  }),

  r({
    slug: 'honey-glazed-ham',
    created: 120,
    input: 'christmas ham. boil gammon 2 hrs then honey mustard glaze, cloves, roast 20 min',
    title: 'Honey Glazed Ham',
    description:
      'Gently poached gammon roasted under a sticky honey and mustard glaze. The centrepiece for Boxing Day, and the leftovers make the best sandwiches of the year.',
    prep: '15 mins',
    cook: '2 hrs 40 mins',
    total: '3 hrs 15 mins',
    servings: '10',
    difficulty: 'Medium',
    ingredients: [
      ['2.5kg', 'gammon joint', 'boneless, unsmoked'],
      ['1', 'onion', 'halved'],
      ['2', 'bay leaves'],
      ['1 tsp', 'black peppercorns'],
      ['4 tbsp', 'runny honey'],
      ['2 tbsp', 'English mustard'],
      ['2 tbsp', 'demerara sugar'],
      ['about 20', 'cloves'],
    ],
    steps: [
      {
        text: 'Put the gammon in a large pan with the onion, bay leaves and peppercorns. Cover with cold water, bring to the boil, skim, then simmer very gently.',
        tip: 'If your joint is very salty, change the water after it first comes to the boil.',
        timings: [['Poach the gammon', '2 hrs']],
      },
      {
        text: 'Heat the oven to 200°C fan. Lift out the gammon and leave to cool slightly, then cut away the skin, leaving a thin layer of fat. Score the fat into diamonds and stud with the cloves.',
        timings: [['Cool slightly', '15 mins']],
      },
      {
        text: 'Mix the honey, mustard and demerara. Brush half over the ham and roast, brushing with the rest halfway, until dark and sticky.',
        tip: 'Watch it closely in the last five minutes — honey burns quickly.',
        timings: [['Glaze in the oven', '25 mins']],
      },
      {
        text: 'Rest before carving. Serve warm, or cold the next day.',
        timings: [['Rest', '20 mins']],
      },
    ],
    proTips: ['Keep the poaching liquid — it makes an excellent base for pea and ham soup.'],
    improvements: [
      'Poached the gammon before glazing so it stays moist',
      'Added mustard to the glaze to cut through the honey',
      'Built in a rest before carving',
    ],
    tags: ['Roast', 'Crowd-pleaser'],
  }),

  r({
    slug: 'graham-cracker-cheesecake',
    created: 92,
    input:
      'new york cheesecake - graham crackers + butter base, cream cheese sugar eggs sour cream. bake 1hr',
    title: 'Graham Cracker Cheesecake',
    description:
      'A tall, creamy baked cheesecake with a tangy lemon note on a crunchy graham cracker base. Slow cooling in the oven keeps the top smooth and crack-free.',
    prep: '30 mins',
    cook: '1 hr',
    total: '6 hrs 30 mins',
    servings: '12',
    difficulty: 'Medium',
    ingredients: [
      ['200g', 'graham crackers', 'or digestive biscuits'],
      ['80g', 'unsalted butter', 'melted'],
      ['600g', 'full-fat cream cheese', 'at room temperature'],
      ['150g', 'caster sugar'],
      ['3', 'eggs', 'at room temperature'],
      ['150ml', 'soured cream'],
      ['1', 'lemon', 'zested'],
      ['1 tsp', 'vanilla extract'],
    ],
    steps: [
      {
        text: 'Heat the oven to 160°C fan. Crush the graham crackers, mix with the melted butter and press into the base of a 23cm springform tin. Bake until firm.',
        timings: [['Bake the base', '10 mins']],
      },
      {
        text: 'Beat the cream cheese and sugar until smooth, then beat in the soured cream, vanilla and lemon zest. Add the eggs one at a time on a low speed.',
        tip: 'Keep the mixer slow — air bubbles are what cause cracks.',
      },
      {
        text: 'Pour over the base and bake until set at the edges with a gentle wobble in the middle.',
        timings: [['Bake', '50 mins']],
      },
      {
        text: 'Turn the oven off, prop the door ajar and leave the cheesecake to cool inside. Then chill until firm.',
        timings: [
          ['Cool in the oven', '1 hr'],
          ['Chill', '4 hrs'],
        ],
      },
    ],
    proTips: ['Run a hot knife around the edge before releasing the tin for a clean finish.'],
    improvements: [
      'Added soured cream to the filling for a tangier, silkier texture',
      'Cooled the cheesecake slowly in the oven to prevent cracks',
    ],
    tags: ['Dessert', 'Make ahead'],
  }),

  r({
    slug: 'mushroom-risotto',
    created: 53,
    input:
      'mushroom risotto - arborio, mushrooms, onion, white wine, stock, parmesan. stir stir stir',
    title: 'Mushroom Risotto',
    description:
      'Creamy, savoury and deeply mushroomy, thanks to a handful of dried porcini in the stock. Twenty minutes of stirring, well rewarded.',
    prep: '10 mins',
    cook: '35 mins',
    total: '45 mins',
    servings: '4',
    difficulty: 'Medium',
    ingredients: [
      ['300g', 'arborio rice'],
      ['400g', 'chestnut mushrooms', 'sliced'],
      ['15g', 'dried porcini mushrooms'],
      ['1', 'onion', 'finely chopped'],
      ['150ml', 'dry white wine'],
      ['1.2 litres', 'vegetable stock', 'kept hot'],
      ['50g', 'butter', 'divided'],
      ['60g', 'Parmesan', 'finely grated, or a vegetarian hard cheese'],
    ],
    steps: [
      {
        text: 'Soak the porcini in 300ml boiling water. Lift them out and chop, then pour the soaking liquid into the stock, leaving any grit behind.',
        timings: [['Soak the porcini', '10 mins']],
      },
      {
        text: 'Fry the chestnut mushrooms in half the butter in a hot pan until golden, then set aside.',
        tip: 'Don’t crowd the pan — they need space to brown rather than sweat.',
        timings: [['Brown the mushrooms', '8 mins']],
      },
      {
        text: 'Soften the onion in the same pan, then add the rice and toast until the edges turn translucent. Pour in the wine and let it bubble until absorbed.',
        timings: [
          ['Soften the onion', '5 mins'],
          ['Toast the rice', '2 mins'],
        ],
      },
      {
        text: 'Add the stock a ladle at a time, stirring, waiting for each to be absorbed before adding the next, until the rice is creamy and just tender.',
        timings: [['Add the stock', '18 mins']],
      },
      {
        text: 'Off the heat, stir in the mushrooms, porcini, remaining butter and the Parmesan. Cover and leave to rest before serving.',
        tip: 'This final rest is what makes it properly creamy.',
        timings: [['Rest', '2 mins']],
      },
    ],
    proTips: ['It should flow slowly across the plate — add an extra splash of stock if it’s stiff.'],
    improvements: [
      'Browned the mushrooms separately for deeper flavour',
      'Added porcini and their soaking liquid to the stock for an earthier backbone',
    ],
    tags: ['Italian', 'Vegetarian'],
  }),

  r({
    slug: 'chickpea-and-spinach-curry',
    created: 12,
    input:
      'chickpea spinach curry. onion garlic curry powder, chickpeas, tomatoes, coconut milk, spinach at end',
    title: 'Chickpea and Spinach Curry',
    description:
      'A mild, creamy coconut curry that comes together from tins in twenty-five minutes. Cheap, vegan and exactly what a Tuesday needs.',
    prep: '5 mins',
    cook: '20 mins',
    total: '25 mins',
    servings: '4',
    difficulty: 'Easy',
    ingredients: [
      ['1', 'onion', 'chopped'],
      ['3 cloves', 'garlic', 'crushed'],
      ['2 tbsp', 'medium curry powder'],
      ['2 x 400g tins', 'chickpeas', 'drained and rinsed'],
      ['1 x 400g tin', 'chopped tomatoes'],
      ['1 x 400ml tin', 'coconut milk'],
      ['200g', 'baby spinach'],
      ['1', 'lime', 'juiced'],
    ],
    steps: [
      {
        text: 'Fry the onion in a splash of oil until soft, then add the garlic and curry powder and cook for a minute until fragrant.',
        tip: 'Toasting the spice in oil takes away its raw, dusty edge.',
        timings: [['Soften the onion', '6 mins']],
      },
      {
        text: 'Tip in the chickpeas, tomatoes and coconut milk. Simmer until thickened.',
        tip: 'Crush a few chickpeas with the back of a spoon for a thicker sauce.',
        timings: [['Simmer', '12 mins']],
      },
      {
        text: 'Stir the spinach through a handful at a time until wilted. Season and add the lime juice.',
        timings: [['Wilt the spinach', '2 mins']],
      },
      'Serve with rice or warm flatbreads.',
    ],
    proTips: ['Freezes well for up to three months — add the spinach fresh when reheating.'],
    improvements: [
      'Toasted the curry powder in oil to take away its raw edge',
      'Finished with lime to brighten the coconut milk',
    ],
    tags: ['Vegan', 'Curry', 'Budget', 'One-pot'],
  }),

  r({
    slug: 'tomato-and-basil-bruschetta',
    created: 68,
    input: 'bruschetta - tomatoes, basil, garlic, olive oil on toasted bread',
    title: 'Tomato and Basil Bruschetta',
    description:
      'Ripe tomatoes, torn basil and good olive oil piled onto garlicky charred sourdough. Only worth making when tomatoes are at their best — and then make lots.',
    prep: '15 mins',
    cook: '5 mins',
    total: '20 mins',
    servings: '4',
    difficulty: 'Easy',
    ingredients: [
      ['400g', 'tomatoes', 'ripe, mixed colours if you can'],
      ['8 slices', 'sourdough'],
      ['1 clove', 'garlic', 'halved'],
      ['small bunch', 'basil', 'leaves torn'],
      ['4 tbsp', 'extra virgin olive oil'],
      ['1 tsp', 'red wine vinegar'],
      ['to taste', 'flaky sea salt'],
    ],
    steps: [
      {
        text: 'Dice the tomatoes, toss with a good pinch of salt and leave in a sieve to drain.',
        tip: 'Draining the juice is what stops the toast going soggy.',
        timings: [['Drain the tomatoes', '10 mins']],
      },
      'Mix the drained tomatoes with the olive oil, vinegar and torn basil.',
      {
        text: 'Griddle or toast the sourdough until charred in places, then rub the cut side of the garlic over each hot slice.',
        timings: [['Toast the sourdough', '4 mins']],
      },
      'Pile the tomatoes onto the toast just before serving and finish with a drizzle of oil.',
    ],
    proTips: ['Never refrigerate the tomatoes — the cold kills their flavour.'],
    improvements: [
      'Salted and drained the tomatoes so the toast stays crisp',
      'Rubbed raw garlic on the hot toast rather than mixing it through',
    ],
    tags: ['Starter', 'Quick'],
  }),

  r({
    slug: 'salmon-teriyaki-traybake',
    created: 30,
    input: 'salmon teriyaki - salmon, broccoli, teriyaki sauce, oven 15-20 mins',
    title: 'Salmon Teriyaki Traybake',
    description:
      'Sticky teriyaki salmon and charred broccoli roasted together on one tray. Half an hour, one tin to wash, and a proper weeknight dinner.',
    prep: '10 mins',
    cook: '20 mins',
    total: '30 mins',
    servings: '4',
    difficulty: 'Easy',
    ingredients: [
      ['4', 'salmon fillets', 'skin on'],
      ['1 large head', 'broccoli', 'cut into florets'],
      ['1 tbsp', 'vegetable oil'],
      ['4 tbsp', 'teriyaki sauce'],
      ['1 tbsp', 'runny honey'],
      ['1 tbsp', 'sesame seeds', 'toasted'],
      ['2', 'spring onions', 'finely sliced'],
    ],
    steps: [
      {
        text: 'Heat the oven to 200°C fan. Toss the broccoli with the oil and a pinch of salt on a large tray and roast.',
        timings: [['Roast the broccoli', '8 mins']],
      },
      'Mix the teriyaki sauce and honey. Nestle the salmon among the broccoli and brush generously with the glaze.',
      {
        text: 'Roast until the salmon flakes easily, brushing with more glaze halfway through.',
        timings: [['Roast the salmon', '12 mins']],
      },
      'Scatter over the sesame seeds and spring onions and serve with rice or noodles.',
    ],
    proTips: ['Line the tray with baking paper — the glaze caramelises and sticks.'],
    improvements: [
      'Gave the broccoli a head start so everything finishes at the same time',
      'Added honey to the teriyaki for a stickier glaze',
    ],
    tags: ['Quick', 'Fish'],
  }),

  r({
    slug: 'overnight-oats',
    created: 45,
    input: 'overnight oats - oats, yoghurt, milk, berries in a jar in fridge',
    title: 'Overnight Oats',
    description:
      'Five minutes the night before gets you a creamy, grab-and-go breakfast for a fraction of the price of a café pot. Endlessly adaptable to whatever fruit you have.',
    prep: '5 mins',
    cook: '0 mins',
    total: '8 hrs 5 mins',
    servings: '2',
    difficulty: 'Easy',
    ingredients: [
      ['100g', 'rolled oats', 'jumbo if you like more texture'],
      ['150g', 'Greek yoghurt'],
      ['200ml', 'milk', 'any kind'],
      ['1 tbsp', 'chia seeds'],
      ['2 tsp', 'maple syrup'],
      ['150g', 'mixed berries', 'fresh or frozen'],
    ],
    steps: [
      'Stir the oats, yoghurt, milk, chia seeds and maple syrup together, then divide between two jars.',
      {
        text: 'Top with the berries, seal and refrigerate overnight.',
        tip: 'Frozen berries thaw into a quick compote by the morning.',
        timings: [['Soak overnight', '8 hrs']],
      },
      'In the morning, loosen with a splash of milk if it’s too thick. Eat cold, or warm briefly in the microwave.',
    ],
    proTips: ['Keeps for three days in the fridge, so make a batch on Sunday.'],
    improvements: [
      'Added chia seeds for a thicker, creamier set',
      'Used Greek yoghurt for extra protein and tang',
    ],
    tags: ['Breakfast', 'Make ahead'],
  }),

  r({
    slug: 'pad-thai',
    created: 25,
    opened: 12,
    input: 'pad thai. rice noodles, prawns, egg, tamarind, fish sauce, peanuts, beansprouts',
    title: 'Pad Thai',
    description:
      'Chewy noodles, sweet prawns and scrambled egg tossed in a sweet, sour and salty tamarind sauce. Faster than ordering in once everything is chopped.',
    prep: '20 mins',
    cook: '10 mins',
    total: '30 mins',
    servings: '2',
    difficulty: 'Medium',
    ingredients: [
      ['200g', 'flat rice noodles'],
      ['200g', 'raw king prawns', 'peeled'],
      ['2', 'eggs', 'beaten'],
      ['2 tbsp', 'tamarind paste', 'mixed with 2 tbsp fish sauce and 1 tbsp brown sugar'],
      ['100g', 'beansprouts'],
      ['4', 'spring onions', 'cut into 3cm lengths'],
      ['40g', 'roasted peanuts', 'roughly chopped'],
      ['1', 'lime', 'cut into wedges'],
    ],
    steps: [
      {
        text: 'Soak the noodles in hot water until pliable but still firm, then drain.',
        tip: 'Undersoak them — they finish cooking in the wok.',
        timings: [['Soak noodles', '8 mins']],
      },
      {
        text: 'Heat a wok with a splash of oil until smoking. Cook the prawns until just pink, push them aside and scramble the eggs next to them.',
        timings: [['Cook prawns and eggs', '3 mins']],
      },
      {
        text: 'Add the noodles and the tamarind sauce and toss until the noodles have absorbed it.',
        timings: [['Toss the noodles', '2 mins']],
      },
      'Toss through the beansprouts and spring onions for 30 seconds, then serve topped with the peanuts and lime wedges.',
    ],
    proTips: ['Have every ingredient ready by the hob before you start — it all moves fast.'],
    improvements: [
      'Balanced the tamarind with fish sauce and sugar for the classic sweet-sour-salty hit',
      'Undersoaked the noodles so they don’t turn mushy in the wok',
    ],
    tags: ['Thai', 'Quick'],
  }),

  r({
    slug: 'coriander-lime-rice',
    created: 77,
    input: 'coriander lime rice - basmati, lime, coriander. like the burrito place',
    title: 'Coriander Lime Rice',
    description:
      'Fluffy basmati brightened with lime zest and a big handful of fresh coriander. The side that makes burrito bowls, curries and grilled fish sing.',
    prep: '5 mins',
    cook: '15 mins',
    total: '20 mins',
    servings: '4',
    difficulty: 'Easy',
    ingredients: [
      ['300g', 'basmati rice'],
      ['450ml', 'cold water'],
      ['15g', 'butter'],
      ['½ tsp', 'salt'],
      ['1', 'lime', 'zested and juiced'],
      ['large bunch', 'coriander', 'finely chopped'],
    ],
    steps: [
      {
        text: 'Rinse the rice in a sieve under cold running water until it runs clear.',
        tip: 'Rinsing washes off surface starch, so the grains stay separate.',
      },
      {
        text: 'Put the rice, water, butter and salt in a pan with a tight-fitting lid. Bring to the boil, then turn the heat to its lowest setting and cook, covered.',
        timings: [['Cook covered', '10 mins']],
      },
      {
        text: 'Take off the heat and leave to steam with the lid on.',
        tip: 'Don’t lift the lid — the steam is doing the work.',
        timings: [['Steam', '5 mins']],
      },
      'Fluff with a fork and fold through the lime zest, lime juice and coriander.',
    ],
    proTips: ['Chop the coriander stalks finely too — they carry most of the flavour.'],
    improvements: [
      'Switched to the absorption method for fluffy, separate grains',
      'Added the coriander and lime off the heat to keep them bright',
    ],
    tags: ['Side', 'Quick'],
  }),

  r({
    slug: 'slow-cooker-beef-stew',
    created: 100,
    input: 'beef stew in slow cooker. beef, carrots, potatoes, onion, stock. 8 hrs on low',
    title: 'Slow Cooker Beef Stew',
    description:
      'Tender chunks of beef, carrots and potatoes in a rich gravy, left to cook low and slow all day. Ten minutes of browning in the morning, dinner waiting in the evening.',
    prep: '20 mins',
    cook: '6 hrs',
    total: '6 hrs 20 mins',
    servings: '6',
    difficulty: 'Easy',
    ingredients: [
      ['1kg', 'beef chuck', 'cut into 4cm chunks'],
      ['2 tbsp', 'plain flour', 'seasoned'],
      ['1', 'onion', 'chopped'],
      ['3', 'carrots', 'cut into thick chunks'],
      ['500g', 'potatoes', 'waxy, cut into chunks'],
      ['2 tbsp', 'tomato purée'],
      ['500ml', 'beef stock', 'hot'],
      ['2', 'bay leaves'],
    ],
    steps: [
      {
        text: 'Toss the beef in the seasoned flour. Brown it in batches in a hot frying pan with a little oil, then transfer to the slow cooker.',
        tip: 'It’s an extra pan to wash, but browning is where the flavour comes from.',
        timings: [['Brown the beef', '10 mins']],
      },
      'Soften the onion in the same pan, stir in the tomato purée, then pour in the stock, scraping up all the browned bits from the bottom.',
      {
        text: 'Add the carrots, potatoes and bay leaves to the slow cooker, pour over the stock and onion, and cook on low until the beef falls apart.',
        timings: [['Slow cook on low', '6 hrs']],
      },
      'Remove the bay leaves, check the seasoning and serve with crusty bread or buttered greens.',
    ],
    proTips: ['It tastes even better the next day, once the flavours have settled.'],
    improvements: [
      'Browned the beef first for a richer, deeper gravy',
      'Deglazed the pan with stock so none of the flavour is left behind',
    ],
    tags: ['Make ahead', 'Budget'],
  }),
]
