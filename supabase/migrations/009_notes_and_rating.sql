-- 009_notes_and_rating.sql
-- Add notes and rating columns to prompts table

ALTER TABLE prompts ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS rating text CHECK (rating IN ('good', 'neutral', 'bad'));
