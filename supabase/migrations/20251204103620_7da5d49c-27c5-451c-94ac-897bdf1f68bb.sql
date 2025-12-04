-- Add columns for tracking read status and user responses
ALTER TABLE public.door_comments 
ADD COLUMN is_read boolean NOT NULL DEFAULT false,
ADD COLUMN user_response text,
ADD COLUMN user_response_at timestamp with time zone;

-- Allow users to update their own comments (for marking as read and adding responses)
CREATE POLICY "Users can update own comments" 
ON public.door_comments 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);