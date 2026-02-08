-- Add INSERT policy for profiles table
-- Allows upsert operations to work correctly with RLS
CREATE POLICY "Profiles: users can insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
