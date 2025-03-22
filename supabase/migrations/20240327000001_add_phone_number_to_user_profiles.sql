-- Add phone_number column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Update types
NOTIFY pgrst, 'reload schema'; 