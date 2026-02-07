-- ==============================================
-- MyPrompt: Initial Database Schema
-- ==============================================

-- 1. Profiles (auto-created on sign-up via trigger)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles: anyone can view"
  on public.profiles for select
  using (true);

create policy "Profiles: users can update own"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 2. Prompts
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  tags text[] not null default '{}',
  phase text not null default 'Implementation',
  visibility text not null default 'Private' check (visibility in ('Private', 'Public')),
  parent_id uuid references public.prompts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.prompts enable row level security;

-- Anyone can read public prompts; owners can read their own
create policy "Prompts: read public or own"
  on public.prompts for select
  using (visibility = 'Public' or auth.uid() = user_id);

create policy "Prompts: insert own"
  on public.prompts for insert
  with check (auth.uid() = user_id);

create policy "Prompts: update own"
  on public.prompts for update
  using (auth.uid() = user_id);

create policy "Prompts: delete own"
  on public.prompts for delete
  using (auth.uid() = user_id);

-- Index for common queries
create index if not exists idx_prompts_user_id on public.prompts(user_id);
create index if not exists idx_prompts_visibility on public.prompts(visibility);
create index if not exists idx_prompts_phase on public.prompts(phase);

-- 3. Prompt History (version snapshots)
create table if not exists public.prompt_history (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.prompt_history enable row level security;

-- Only prompt owner can view history
create policy "History: owner can view"
  on public.prompt_history for select
  using (
    exists (
      select 1 from public.prompts
      where prompts.id = prompt_history.prompt_id
        and prompts.user_id = auth.uid()
    )
  );

create policy "History: owner can insert"
  on public.prompt_history for insert
  with check (
    exists (
      select 1 from public.prompts
      where prompts.id = prompt_history.prompt_id
        and prompts.user_id = auth.uid()
    )
  );

-- 4. Favorites
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, prompt_id)
);

alter table public.favorites enable row level security;

create policy "Favorites: user manages own"
  on public.favorites for all
  using (auth.uid() = user_id);

create index if not exists idx_favorites_user_id on public.favorites(user_id);
