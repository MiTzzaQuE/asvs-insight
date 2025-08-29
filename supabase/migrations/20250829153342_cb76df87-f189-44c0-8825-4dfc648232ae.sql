-- Update all existing requirements with NULL user_id to belong to the first authenticated user
-- This is a one-time fix for existing data
UPDATE requirements 
SET user_id = (
  SELECT id 
  FROM auth.users 
  LIMIT 1
)
WHERE user_id IS NULL;

-- Make user_id NOT NULL to prevent this issue in the future
ALTER TABLE requirements 
ALTER COLUMN user_id SET NOT NULL;