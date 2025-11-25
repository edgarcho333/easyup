-- ============================================
-- FIX: Organizations SELECT Policy Bug
-- ============================================
-- Bug: Wrong column reference in WHERE clause
-- user_organizations.organization_id = user_organizations.id (WRONG)
-- Should be: user_organizations.organization_id = organizations.id

DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;

CREATE POLICY "Users can view their organizations"
  ON public.organizations FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_organizations
      WHERE organization_id = organizations.id AND status = 'active'
    )
  );

-- Verify the fix
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'organizations'
  AND policyname = 'Users can view their organizations';
