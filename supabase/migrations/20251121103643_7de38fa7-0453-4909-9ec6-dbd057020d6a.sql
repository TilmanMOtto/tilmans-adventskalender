-- Add English language columns to calendar_entries
ALTER TABLE public.calendar_entries 
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS story_en TEXT;

-- Add language preference to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(2) DEFAULT 'de';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.preferred_language IS 'User preferred language: de (German) or en (English)';