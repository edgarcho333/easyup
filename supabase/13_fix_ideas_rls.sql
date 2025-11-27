-- =====================================================
-- FIX IDEAS RLS POLICY
-- Migration 13: Simplify Ideas INSERT policy
-- =====================================================

-- Problem: User can't create ideas because they're not in project_members
-- Solution: Allow any authenticated user to create ideas (for now)

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "project_members_can_create_ideas" ON public.ideas;
DROP POLICY IF EXISTS "authenticated_users_can_create_ideas" ON public.ideas;
DROP POLICY IF EXISTS "allow_authenticated_create_ideas" ON public.ideas;

-- Create simpler policy - authenticated users can create ideas
CREATE POLICY "allow_authenticated_create_ideas" ON public.ideas
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Also update tasks policy to be consistent (if it exists)
DROP POLICY IF EXISTS "project_members_can_create_tasks" ON public.tasks;

-- Comments
COMMENT ON POLICY "allow_authenticated_create_ideas" ON public.ideas IS 'Simplified: Any authenticated user can create ideas (project membership check removed)';
