-- ============================================
-- FIX: RLS Policies for Registration Flow
-- ============================================
-- Issue: Users can't insert organizations during registration
-- Solution: Allow authenticated users to insert their own organizations

-- Drop existing insert policy (if exists)
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;

-- Create new insert policy that allows user to create org where they are the owner
CREATE POLICY "Users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Also ensure user_organizations insert policy allows self-insert
DROP POLICY IF EXISTS "Users can create memberships" ON public.user_organizations;

CREATE POLICY "Users can create memberships"
  ON public.user_organizations FOR INSERT
  WITH CHECK (
    -- User can create membership for themselves
    auth.uid() = user_id
    OR
    -- Or if they are the owner of the organization
    auth.uid() IN (
      SELECT owner_id FROM public.organizations WHERE id = organization_id
    )
  );

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'user_organizations')
ORDER BY tablename, policyname;
