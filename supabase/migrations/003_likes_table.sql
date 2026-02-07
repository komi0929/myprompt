-- ==============================================
-- MyPrompt: Likes Table + like_count on prompts
-- ==============================================

-- 1. Likes table (one like per user per prompt)
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, prompt_id)
);

alter table public.likes enable row level security;

-- Anyone can see likes (for counting)
create policy "Likes: anyone can view"
  on public.likes for select
  using (true);

-- Users can manage their own likes
create policy "Likes: user manages own"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "Likes: user deletes own"
  on public.likes for delete
  using (auth.uid() = user_id);

create index if not exists idx_likes_user_id on public.likes(user_id);
create index if not exists idx_likes_prompt_id on public.likes(prompt_id);

-- 2. Add like_count column to prompts for efficient querying
alter table public.prompts add column if not exists like_count integer not null default 0;

-- 3. Trigger to auto-update like_count on prompts
create or replace function public.update_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' then
    update public.prompts set like_count = like_count + 1 where id = new.prompt_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update public.prompts set like_count = like_count - 1 where id = old.prompt_id;
    return old;
  end if;
  return null;
end;
$$;

create or replace trigger on_like_change
  after insert or delete on public.likes
  for each row
  execute function public.update_like_count();
