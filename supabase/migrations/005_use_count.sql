-- ==============================================
-- MyPrompt: Add use_count column + increment RPC
-- ==============================================

-- Add use_count column to prompts
alter table public.prompts
  add column if not exists use_count integer not null default 0;

-- Create index for sorting by usage
create index if not exists idx_prompts_use_count on public.prompts(use_count);

-- RPC to atomically increment use_count
create or replace function public.increment_use_count(prompt_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.prompts
  set use_count = use_count + 1
  where id = prompt_id;
end;
$$;
