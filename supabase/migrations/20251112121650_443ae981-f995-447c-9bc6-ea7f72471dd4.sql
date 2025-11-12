-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS issues)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Migrate existing admin users from profiles.is_admin to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.profiles
WHERE is_admin = true;

-- Grant regular 'user' role to all non-admin users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::app_role
FROM public.profiles
WHERE is_admin = false OR is_admin IS NULL;

-- Drop dependent policies on calendar_entries first
DROP POLICY IF EXISTS "Only admins can insert calendar entries" ON public.calendar_entries;
DROP POLICY IF EXISTS "Only admins can update calendar entries" ON public.calendar_entries;
DROP POLICY IF EXISTS "Only admins can delete calendar entries" ON public.calendar_entries;

-- Drop dependent storage policies
DROP POLICY IF EXISTS "Admins can upload calendar images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update calendar images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete calendar images" ON storage.objects;

-- Now we can safely drop the is_admin column
ALTER TABLE public.profiles DROP COLUMN is_admin;

-- Update profiles SELECT policy to require authentication
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Recreate calendar_entries policies using has_role function
CREATE POLICY "Only admins can insert calendar entries"
ON public.calendar_entries
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update calendar entries"
ON public.calendar_entries
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete calendar entries"
ON public.calendar_entries
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Recreate storage policies using has_role function
CREATE POLICY "Admins can upload calendar images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'calendar-images' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update calendar images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'calendar-images' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete calendar images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'calendar-images' AND
  public.has_role(auth.uid(), 'admin')
);

-- Add RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only admins can manage roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update handle_new_user function to assign 'user' role to new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, username)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8))
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;