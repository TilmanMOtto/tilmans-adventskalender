-- Add reply columns to door_comments table
ALTER TABLE public.door_comments
ADD COLUMN reply_text TEXT,
ADD COLUMN replied_at TIMESTAMPTZ;