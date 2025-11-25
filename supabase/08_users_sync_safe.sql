-- =====================================================
-- PUBLIC USERS TABLE + AUTH SYNC (SAFE VERSION)
-- Migration 08: Sync auth.users with public.users
-- =====================================================

-- First, check if table exists and drop if needed (CAREFUL!)
-- DROP TABLE IF EXISTS public.users CASCADE;

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
-- 2. AUTO-SYNC TRIGGER (auth.users -> public.users)
-- =====================================================

-- Function to sync auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert/update
-- Note: This requires superuser or specific permissions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 3. SYNC EXISTING AUTH USERS
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
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "authenticated_users_can_read_users" ON public.users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.users;

-- Anyone authenticated can read users
CREATE POLICY "authenticated_users_can_read_users" ON public.users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can update their own profile
CREATE POLICY "users_can_update_own_profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.users IS 'Public user profiles synced from auth.users';
