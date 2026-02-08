-- 008: Add last_used_at to prompts for recently-used tracking
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS last_used_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_prompts_last_used ON prompts (user_id, last_used_at DESC NULLS LAST);
