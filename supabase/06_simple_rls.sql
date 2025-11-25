-- ============================================
-- SIMPLE RLS WITHOUT RECURSION
-- ============================================
-- Use this AFTER testing with RLS disabled

-- Re-enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "select_own_organizations" ON public.organizations;
DROP POLICY IF EXISTS "insert_own_organizations" ON public.organizations;
DROP POLICY IF EXISTS "update_own_organizations" ON public.organizations;
DROP POLICY IF EXISTS "delete_own_organizations" ON public.organizations;
DROP POLICY IF EXISTS "select_memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "insert_memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "update_memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "delete_memberships" ON public.user_organizations;

-- SIMPLE POLICIES (no joins, no recursion)

-- Organizations: Anyone authenticated can read
CREATE POLICY "anyone_can_read_orgs" ON public.organizations
  FOR SELECT USING (true);

-- Organizations: Authenticated users can create where they are owner
CREATE POLICY "users_can_create_orgs" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Organizations: Only owner can update
CREATE POLICY "owners_can_update_orgs" ON public.organizations
  FOR UPDATE USING (auth.uid() = owner_id);

-- Organizations: Only owner can delete
CREATE POLICY "owners_can_delete_orgs" ON public.organizations
  FOR DELETE USING (auth.uid() = owner_id);

-- User Organizations: Anyone authenticated can read
CREATE POLICY "anyone_can_read_memberships" ON public.user_organizations
  FOR SELECT USING (true);

-- User Organizations: Users can create their own memberships
CREATE POLICY "users_can_create_memberships" ON public.user_organizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Organizations: Users can update their own memberships
CREATE POLICY "users_can_update_memberships" ON public.user_organizations
  FOR UPDATE USING (auth.uid() = user_id);

-- User Organizations: Users can delete their own memberships
CREATE POLICY "users_can_delete_memberships" ON public.user_organizations
  FOR DELETE USING (auth.uid() = user_id);

-- Roles: Everyone can read roles (needed for registration)
CREATE POLICY "anyone_can_read_roles" ON public.roles
  FOR SELECT USING (true);

-- Note: This is a simplified version for testing.
-- In production, you should restrict SELECT to only relevant records.
