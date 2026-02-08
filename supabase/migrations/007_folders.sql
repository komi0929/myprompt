-- ==============================================
-- MyPrompt: Add folders/categories feature
-- ==============================================

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default '#fbbf24',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.folders enable row level security;

-- RLS policies
create policy "Users can view own folders"
  on public.folders for select
  using (auth.uid() = user_id);

create policy "Users can insert own folders"
  on public.folders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own folders"
  on public.folders for update
  using (auth.uid() = user_id);

create policy "Users can delete own folders"
  on public.folders for delete
  using (auth.uid() = user_id);

-- Add folder_id to prompts
alter table public.prompts
  add column if not exists folder_id uuid references public.folders(id) on delete set null;
