-- Add label column to prompt_history for user-defined version names
alter table public.prompt_history add column if not exists label text;
