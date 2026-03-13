-- Add organization columns for recipe search & favorites
ALTER TABLE public.saved_recipes
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMPTZ;
