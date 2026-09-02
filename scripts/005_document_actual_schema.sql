-- 005: Reconcile scripts/ with the live schema.
--
-- Scripts 001-004 no longer describe the deployed database. 001 declares
--   user_id UUID NOT NULL REFERENCES auth.users(id)
-- with four strict `auth.uid() = user_id` policies, but the application has
-- never written user_id and its inserts succeed -- so the live table has
-- nullable/absent user_id and permissive policies. The live table also has
-- original_input and original_analysis columns that appear in no migration.
--
-- The app is single-user and protected at the edge (root proxy.ts) plus a
-- server-side session check in every API route (lib/auth/require-user.ts).
-- RLS is deliberately left permissive; see the security note in README.md.
--
-- This migration is idempotent and additive. Running it brings a fresh
-- Supabase project in line with the deployed one.

-- Columns the app reads and writes but 001-004 never declared.
ALTER TABLE public.saved_recipes
  ADD COLUMN IF NOT EXISTS original_input TEXT,
  ADD COLUMN IF NOT EXISTS original_analysis JSONB;

-- The app does not populate user_id. Keep the column for the upgrade path
-- described in the README, but don't let NOT NULL block inserts.
ALTER TABLE public.saved_recipes
  ALTER COLUMN user_id DROP NOT NULL;

-- Replace the per-user policies with the permissive ones actually in force,
-- matching the pattern already used by 002 (push_timers) and 003
-- (meal_plan_entries).
DROP POLICY IF EXISTS "Users can view their own recipes" ON public.saved_recipes;
DROP POLICY IF EXISTS "Users can insert their own recipes" ON public.saved_recipes;
DROP POLICY IF EXISTS "Users can update their own recipes" ON public.saved_recipes;
DROP POLICY IF EXISTS "Users can delete their own recipes" ON public.saved_recipes;

DROP POLICY IF EXISTS "Allow all saved_recipes operations" ON public.saved_recipes;
CREATE POLICY "Allow all saved_recipes operations" ON public.saved_recipes
  FOR ALL USING (true) WITH CHECK (true);

-- Upgrade path, if this ever becomes multi-user: backfill user_id from
-- auth.users, restore NOT NULL, and swap the policy above back to the four
-- `auth.uid() = user_id` policies from 001. meal_plan_entries would need a
-- user_id column adding first -- it has none.
