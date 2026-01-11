-- Rename 'desc' column to 'description' to avoid reserved keyword issues
ALTER TABLE habits RENAME COLUMN "desc" TO description;

-- Drop the string_delimiter column from habit_number_modal_config if it exists
-- This column should be transient and not persisted
ALTER TABLE habit_number_modal_config DROP COLUMN IF EXISTS string_delimiter;

