-- =====================================================
-- PUBLIC USERS TABLE
-- Migration 07: Create public.users for JOIN queries
-- =====================================================

-- =====================================================
-- 1. PUBLIC USERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON public.users;
CREATE TRIGGER trigger_update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- =====================================================
-- 2. SYNC EXISTING AUTH USERS (ONE-TIME)
-- =====================================================

-- Insert all existing auth.users into public.users
INSERT INTO public.users (id, email, full_name, avatar_url)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "authenticated_users_can_read_users" ON public.users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.users;

-- Anyone authenticated can read users
CREATE POLICY "authenticated_users_can_read_users" ON public.users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can insert their own profile during registration
CREATE POLICY "users_can_insert_own_profile" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_can_update_own_profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.users IS 'Public user profiles (manually synced from auth.users during registration)';
COMMENT ON COLUMN public.users.full_name IS 'User full name from auth metadata';
COMMENT ON COLUMN public.users.avatar_url IS 'User avatar URL from auth metadata';

-- =====================================================
-- NOTE:
-- =====================================================
-- Since we can't create triggers on auth.users without superuser permissions,
-- we manually insert into public.users in authService.register()
-- This is a standard Supabase pattern when trigger permissions are limited.
