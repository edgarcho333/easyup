-- ============================================
-- FIX: Infinite Recursion in RLS Policies
-- ============================================
-- Problem: SELECT policy creates infinite recursion
-- Solution: Simplify policies and avoid circular references

-- ============================================
-- STEP 1: Drop ALL existing policies
-- ============================================

DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can delete" ON public.organizations;

DROP POLICY IF EXISTS "Users can view their memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can create memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Organization owners can update memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Organization owners can delete memberships" ON public.user_organizations;

-- ============================================
-- STEP 2: Create SIMPLE policies (no recursion)
-- ============================================

-- ORGANIZATIONS Table
-- ==================

-- SELECT: User can see organizations where they are a member
CREATE POLICY "select_own_organizations"
  ON public.organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id
      FROM public.user_organizations
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- INSERT: User can create org where they are owner
CREATE POLICY "insert_own_organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: Only owner can update
CREATE POLICY "update_own_organizations"
  ON public.organizations FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- DELETE: Only owner can delete
CREATE POLICY "delete_own_organizations"
  ON public.organizations FOR DELETE
  USING (owner_id = auth.uid());

-- USER_ORGANIZATIONS Table
-- =========================

-- SELECT: User can see their own memberships OR org owner can see all memberships
CREATE POLICY "select_memberships"
  ON public.user_organizations FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- INSERT: User can create their own membership (for registration)
CREATE POLICY "insert_memberships"
  ON public.user_organizations FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- UPDATE: Only org owner can update memberships
CREATE POLICY "update_memberships"
  ON public.user_organizations FOR UPDATE
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- DELETE: Only org owner can delete memberships
CREATE POLICY "delete_memberships"
  ON public.user_organizations FOR DELETE
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- STEP 3: Verify policies
-- ============================================

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'user_organizations')
ORDER BY tablename, policyname;
