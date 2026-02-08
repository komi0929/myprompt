-- ==============================================
-- Feedback & Changelog System
-- ==============================================

-- 1. Feedback table (feature requests & bug reports)
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('feature', 'bug')),
  title text not null default '',
  description text not null default '',
  screenshot_url text default null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done', 'rejected')),
  like_count integer not null default 0,
  author_name text not null default 'ゲスト',
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Anyone can read feedback
create policy "Feedback: anyone can read"
  on public.feedback for select
  using (true);

-- Anyone can insert (including anonymous)
create policy "Feedback: anyone can insert"
  on public.feedback for insert
  with check (true);

-- Only admin can update/delete (via service role)

-- Index
create index if not exists idx_feedback_type on public.feedback(type);
create index if not exists idx_feedback_status on public.feedback(status);
create index if not exists idx_feedback_created on public.feedback(created_at desc);

-- 2. Feedback Likes (session-based, no auth required)
create table if not exists public.feedback_likes (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  session_id text not null,
  created_at timestamptz not null default now(),
  unique(feedback_id, session_id)
);

alter table public.feedback_likes enable row level security;

create policy "FeedbackLikes: anyone can read"
  on public.feedback_likes for select
  using (true);

create policy "FeedbackLikes: anyone can insert"
  on public.feedback_likes for insert
  with check (true);

create policy "FeedbackLikes: anyone can delete own"
  on public.feedback_likes for delete
  using (true);

-- Index
create index if not exists idx_feedback_likes_feedback on public.feedback_likes(feedback_id);

-- 3. Changelog table
create table if not exists public.changelog (
  id uuid primary key default gen_random_uuid(),
  version text not null default '',
  title text not null default '',
  description text not null default '',
  type text not null default 'improvement' check (type in ('feature', 'improvement', 'bugfix')),
  created_at timestamptz not null default now()
);

alter table public.changelog enable row level security;

create policy "Changelog: anyone can read"
  on public.changelog for select
  using (true);

-- Only admin can insert/update/delete (via service role)

-- 4. Function to increment like count
create or replace function public.increment_feedback_like(p_feedback_id uuid, p_session_id text)
returns void
language plpgsql
security definer
as $$
begin
  -- Try to insert a like
  insert into public.feedback_likes (feedback_id, session_id)
  values (p_feedback_id, p_session_id);
  
  -- Update the count
  update public.feedback
  set like_count = (
    select count(*) from public.feedback_likes where feedback_id = p_feedback_id
  )
  where id = p_feedback_id;
exception
  when unique_violation then
    -- Already liked, remove it
    delete from public.feedback_likes
    where feedback_id = p_feedback_id and session_id = p_session_id;
    
    update public.feedback
    set like_count = (
      select count(*) from public.feedback_likes where feedback_id = p_feedback_id
    )
    where id = p_feedback_id;
end;
$$;
