-- Fix 1: Role Privilege Escalation
-- Drop and recreate the enum to avoid conflicts
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('hirer', 'worker');

-- Create user_roles table that users cannot modify
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- NO INSERT, UPDATE, or DELETE policies - users cannot modify roles

-- Create security definer function to check roles
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
  );
$$;

-- Create helper function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- Migrate existing roles from profiles to user_roles
-- Cast text representation to enum
INSERT INTO public.user_roles (user_id, role)
SELECT id, 
  CASE 
    WHEN role::text = 'hirer' THEN 'hirer'::app_role
    WHEN role::text = 'worker' THEN 'worker'::app_role
    ELSE 'hirer'::app_role
  END as role
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Update profiles table to make role column read-only via RLS
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- New policy: users can update their profile but NOT the role column
CREATE POLICY "Users can update own profile except role"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    role::text = (SELECT get_user_role(auth.uid())::text)
  );

-- Update the handle_new_user function to use user_roles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_text TEXT;
  user_role_enum app_role;
BEGIN
  -- Get role from metadata, default to 'hirer'
  user_role_text := COALESCE(NEW.raw_user_meta_data->>'role', 'hirer');
  user_role_enum := user_role_text::app_role;
  
  -- Insert into profiles (keeping user_role enum for backward compatibility)
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    user_role_text::user_role
  );
  
  -- Insert into user_roles (the authoritative source)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role_enum);
  
  RETURN NEW;
END;
$$;

-- Fix search_path on update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;