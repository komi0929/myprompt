-- ==============================================
-- MyPrompt: Add is_pinned column for pin feature
-- ==============================================

alter table public.prompts
  add column if not exists is_pinned boolean not null default false;

-- Index for efficient pinned prompt queries
create index if not exists idx_prompts_pinned on public.prompts(user_id, is_pinned) where is_pinned = true;
