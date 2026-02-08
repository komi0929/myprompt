-- 010_supplementary_info.sql
-- notesカラム（009で作成済み）を「補足情報」として使用
-- 用途の明確化のためコメントを追加
COMMENT ON COLUMN prompts.notes IS '補足情報: プロンプトの背景、使い方のコツなど';
