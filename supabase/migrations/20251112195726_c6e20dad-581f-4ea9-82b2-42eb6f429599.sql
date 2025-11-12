-- Make user_id nullable in email_notifications to support bulk sends
ALTER TABLE email_notifications 
ALTER COLUMN user_id DROP NOT NULL;