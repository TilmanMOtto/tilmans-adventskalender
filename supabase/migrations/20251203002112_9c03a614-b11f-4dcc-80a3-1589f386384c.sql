-- Create door_likes table
CREATE TABLE public.door_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, day_number)
);

-- Create door_comments table
CREATE TABLE public.door_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.door_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.door_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for door_likes
CREATE POLICY "Users can view all likes" ON public.door_likes
FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes" ON public.door_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.door_likes
FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for door_comments
CREATE POLICY "Users can view own comments" ON public.door_comments
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all comments" ON public.door_comments
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own comments" ON public.door_comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.door_comments
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comments" ON public.door_comments
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));