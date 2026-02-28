-- Create saved_recipes table
CREATE TABLE IF NOT EXISTS public.saved_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  recipe_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS saved_recipes_user_id_idx ON public.saved_recipes(user_id);
CREATE INDEX IF NOT EXISTS saved_recipes_created_at_idx ON public.saved_recipes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own recipes" 
  ON public.saved_recipes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes" 
  ON public.saved_recipes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes" 
  ON public.saved_recipes FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes" 
  ON public.saved_recipes FOR DELETE 
  USING (auth.uid() = user_id);
