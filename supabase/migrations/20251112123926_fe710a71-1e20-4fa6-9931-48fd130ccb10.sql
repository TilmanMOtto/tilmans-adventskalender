-- Add support for multiple images per calendar entry
-- Add new column for multiple image URLs as a JSON array
ALTER TABLE calendar_entries 
ADD COLUMN image_urls jsonb DEFAULT '[]'::jsonb;

-- Migrate existing single image_url to image_urls array
UPDATE calendar_entries 
SET image_urls = jsonb_build_array(image_url) 
WHERE image_url IS NOT NULL;

-- Keep the old image_url column for backward compatibility during transition
-- but it will no longer be used in the app