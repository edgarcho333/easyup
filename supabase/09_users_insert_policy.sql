-- =====================================================
-- ADD INSERT POLICY FOR PUBLIC.USERS
-- Migration 09: Allow users to insert their own profile
-- =====================================================

-- Drop existing policy if any
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.users;

-- Users can insert their own profile during registration
CREATE POLICY "users_can_insert_own_profile" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

COMMENT ON POLICY "users_can_insert_own_profile" ON public.users IS 'Allow users to create their own profile during registration';
