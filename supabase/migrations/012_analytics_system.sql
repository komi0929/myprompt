-- ==============================================
-- Analytics & Feature Flags System
-- ==============================================

-- 1. Analytics Events (raw event log)
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  session_id text not null default '',
  user_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;

-- Only admin can read analytics (via service role or policy)
-- Anyone can insert (client-side tracking)
create policy "Analytics: anyone can insert"
  on public.analytics_events for insert
  with check (true);

create policy "Analytics: admin can read"
  on public.analytics_events for select
  using (
    exists (
      select 1 from auth.users
      where auth.uid() = id
        and email = 'komi0929@gmail.com'
    )
  );

-- Indexes for fast aggregation
create index if not exists idx_analytics_event_name on public.analytics_events(event_name);
create index if not exists idx_analytics_created on public.analytics_events(created_at desc);
create index if not exists idx_analytics_session on public.analytics_events(session_id);

-- 2. Feature Flags
create table if not exists public.feature_flags (
  id text primary key,
  label text not null default '',
  description text not null default '',
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.feature_flags enable row level security;

-- Anyone can read flags (needed for client-side feature gating)
create policy "FeatureFlags: anyone can read"
  on public.feature_flags for select
  using (true);

-- Seed default flags
insert into public.feature_flags (id, label, description, enabled) values
  ('welcome_overlay', 'ウェルカム画面', '初回訪問時のオンボーディング画面', true),
  ('social_features', 'ソーシャル機能', 'いいね・お気に入り機能', true),
  ('public_prompts', 'みんなのプロンプト', '公開プロンプト一覧', true),
  ('template_variables', 'テンプレート変数', '{変数}を使ったテンプレート機能', true),
  ('feedback_system', 'フィードバック', '改善提案・バグ報告機能', true),
  ('copy_buffer', 'コピーバッファ', 'コピー履歴バッファ機能', true),
  ('command_palette', 'コマンドパレット', 'Ctrl+K コマンドパレット', true)
on conflict (id) do nothing;

-- 3. Daily KPI Cache (aggregated by cron or on-demand)
create table if not exists public.daily_kpi (
  date date primary key,
  dau integer not null default 0,
  new_signups integer not null default 0,
  prompts_created integer not null default 0,
  copies_executed integer not null default 0,
  prompts_published integer not null default 0,
  likes_given integer not null default 0,
  favorites_given integer not null default 0,
  searches integer not null default 0,
  feedback_submitted integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.daily_kpi enable row level security;

create policy "DailyKPI: admin can read"
  on public.daily_kpi for select
  using (
    exists (
      select 1 from auth.users
      where auth.uid() = id
        and email = 'komi0929@gmail.com'
    )
  );

create policy "DailyKPI: anyone can upsert"
  on public.daily_kpi for insert
  with check (true);

create policy "DailyKPI: anyone can update"
  on public.daily_kpi for update
  using (true);

-- 4. Function to aggregate daily KPI from raw events
create or replace function public.aggregate_daily_kpi(target_date date)
returns void
language plpgsql
security definer
as $$
declare
  day_start timestamptz := target_date::timestamptz;
  day_end timestamptz := (target_date + interval '1 day')::timestamptz;
begin
  insert into public.daily_kpi (date, dau, new_signups, prompts_created, copies_executed, prompts_published, likes_given, favorites_given, searches, feedback_submitted)
  values (
    target_date,
    (select count(distinct session_id) from public.analytics_events where created_at >= day_start and created_at < day_end),
    (select count(*) from public.analytics_events where event_name = 'sign_up' and created_at >= day_start and created_at < day_end),
    (select count(*) from public.analytics_events where event_name = 'prompt_create' and created_at >= day_start and created_at < day_end),
    (select count(*) from public.analytics_events where event_name = 'prompt_copy' and created_at >= day_start and created_at < day_end),
    (select count(*) from public.analytics_events where event_name = 'prompt_publish' and created_at >= day_start and created_at < day_end),
    (select count(*) from public.analytics_events where event_name = 'prompt_like' and created_at >= day_start and created_at < day_end),
    (select count(*) from public.analytics_events where event_name = 'prompt_favorite' and created_at >= day_start and created_at < day_end),
    (select count(*) from public.analytics_events where event_name = 'search_execute' and created_at >= day_start and created_at < day_end),
    (select count(*) from public.analytics_events where event_name = 'feedback_submit' and created_at >= day_start and created_at < day_end)
  )
  on conflict (date) do update set
    dau = excluded.dau,
    new_signups = excluded.new_signups,
    prompts_created = excluded.prompts_created,
    copies_executed = excluded.copies_executed,
    prompts_published = excluded.prompts_published,
    likes_given = excluded.likes_given,
    favorites_given = excluded.favorites_given,
    searches = excluded.searches,
    feedback_submitted = excluded.feedback_submitted,
    updated_at = now();
end;
$$;
