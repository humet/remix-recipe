CREATE TABLE public.meal_plan_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.saved_recipes(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_date)  -- one dinner per day
);

CREATE INDEX meal_plan_entries_date_idx ON public.meal_plan_entries(plan_date);

-- RLS (disabled at app level, matching saved_recipes pattern)
ALTER TABLE public.meal_plan_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select" ON public.meal_plan_entries FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.meal_plan_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.meal_plan_entries FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.meal_plan_entries FOR DELETE USING (true);
