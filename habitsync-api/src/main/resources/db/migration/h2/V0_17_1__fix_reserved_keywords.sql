-- Rename 'desc' column to 'description' to avoid reserved keyword issues
ALTER TABLE HABITS ALTER COLUMN DESC RENAME TO description;

-- Drop the STRING_DELIMITER column from HABIT_NUMBER_MODAL_CONFIG as it should be transient
ALTER TABLE HABIT_NUMBER_MODAL_CONFIG DROP COLUMN IF EXISTS STRING_DELIMITER;

