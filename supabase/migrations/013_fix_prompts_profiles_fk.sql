-- 013_fix_prompts_profiles_fk.sql
-- Fix: PostgREST cannot find FK relationship between prompts and profiles.
-- The initial migration defined prompts.user_id as FK to profiles(id),
-- but the constraint may not exist in the production database.
-- This migration ensures the FK is explicitly present.

-- First drop the existing FK if it exists (to make this idempotent)
DO $$
BEGIN
  -- Check if the constraint already exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'prompts_user_id_profiles_fkey'
    AND table_name = 'prompts'
  ) THEN
    ALTER TABLE public.prompts DROP CONSTRAINT prompts_user_id_profiles_fkey;
  END IF;
END $$;

-- Also check for the auto-generated constraint name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'prompts_user_id_fkey'
    AND table_name = 'prompts'
  ) THEN
    ALTER TABLE public.prompts DROP CONSTRAINT prompts_user_id_fkey;
  END IF;
END $$;

-- Re-create the FK explicitly
ALTER TABLE public.prompts
  ADD CONSTRAINT prompts_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
