-- Add RLS policy to allow admins to view all user progress
CREATE POLICY "Admins can view all user progress"
ON public.user_progress
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));