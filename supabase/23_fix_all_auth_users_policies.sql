-- =============================================
-- FIX ALL RLS POLICIES THAT USE auth.users
-- Problem: RLS policies cannot access auth.users table
-- Solution: Use get_current_user_email() function (JWT-based)
-- =============================================

-- =============================================
-- 1. ENSURE HELPER FUNCTION EXISTS
-- =============================================

CREATE OR REPLACE FUNCTION get_current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'email',
    (auth.jwt() -> 'user_metadata' ->> 'email')
  )
$$;

GRANT EXECUTE ON FUNCTION get_current_user_email() TO authenticated;

-- =============================================
-- 2. FIX INVITATIONS POLICIES
-- =============================================

-- Drop all problematic policies on invitations
DROP POLICY IF EXISTS "Users can view their own invitations" ON invitations;
DROP POLICY IF EXISTS "Users can accept invitations" ON invitations;
DROP POLICY IF EXISTS "Users can accept their own invitations" ON invitations;
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON invitations;

-- Recreate with JWT-based email lookup
CREATE POLICY "Users can view their own invitations"
    ON invitations FOR SELECT
    USING (email = get_current_user_email());

CREATE POLICY "Anyone can view invitation by token"
    ON invitations FOR SELECT
    USING (token IS NOT NULL);

CREATE POLICY "Users can accept invitations"
    ON invitations FOR UPDATE
    USING (
        email = get_current_user_email()
        OR EXISTS (
            SELECT 1 FROM user_organizations uo
            JOIN roles r ON r.id = uo.role_id
            WHERE uo.organization_id = invitations.organization_id
            AND uo.user_id = auth.uid()
            AND uo.status = 'active'
            AND r.name IN ('super_admin', 'account_manager')
        )
    );

-- =============================================
-- 3. FIX PROJECT_MEMBERS POLICIES
-- =============================================

DROP POLICY IF EXISTS "users_can_join_via_invitation" ON project_members;

CREATE POLICY "users_can_join_via_invitation" ON project_members
  FOR INSERT
  WITH CHECK (
    -- User is adding themselves
    auth.uid() = user_id
    AND (
      -- They have a pending invitation to this project
      EXISTS (
        SELECT 1 FROM invitations
        WHERE invitations.project_id = project_members.project_id
          AND invitations.email = get_current_user_email()
          AND invitations.status = 'pending'
      )
      OR
      -- Or they're being added by a lead/creator
      (
        auth.uid() = added_by
        AND (
          EXISTS (
            SELECT 1 FROM projects
            WHERE id = project_members.project_id
              AND created_by = auth.uid()
          )
          OR
          EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = project_members.project_id
              AND pm.user_id = auth.uid()
              AND pm.is_lead = TRUE
          )
        )
      )
    )
  );

-- =============================================
-- VERIFICATION QUERY (run separately to check)
-- =============================================
-- SELECT policyname, cmd, qual::text
-- FROM pg_policies
-- WHERE tablename IN ('invitations', 'project_members')
-- AND qual::text LIKE '%auth.users%';
