-- Migration to increase the length of reminder_custom field to support longer JSON strings

ALTER TABLE PUBLIC.HABITS
ALTER COLUMN REMINDER_CUSTOM SET DATA TYPE TEXT;
