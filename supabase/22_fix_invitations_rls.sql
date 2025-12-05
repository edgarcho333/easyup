-- =============================================
-- FIX INVITATIONS RLS POLICIES
-- Problem: RLS policies can't access users table
-- Solution: Use auth.jwt() to get email directly from JWT token
-- =============================================

-- =============================================
-- 1. CREATE HELPER FUNCTION
-- =============================================

-- This function extracts email directly from the JWT token
-- No table access needed - completely bypasses RLS issues
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_current_user_email() TO authenticated;

-- =============================================
-- 2. DROP EXISTING PROBLEMATIC POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view their own invitations" ON invitations;
DROP POLICY IF EXISTS "Users can accept invitations" ON invitations;
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON invitations;

-- =============================================
-- 3. RECREATE POLICIES USING THE FUNCTION
-- =============================================

-- Users can view their own invitations (by email)
CREATE POLICY "Users can view their own invitations"
    ON invitations FOR SELECT
    USING (
        email = get_current_user_email()
    );

-- Anyone can view invitation by token (for invite landing page)
CREATE POLICY "Anyone can view invitation by token"
    ON invitations FOR SELECT
    USING (token IS NOT NULL);

-- Users can accept invitations sent to their email
CREATE POLICY "Users can accept invitations"
    ON invitations FOR UPDATE
    USING (
        -- User can update if invitation is for their email
        email = get_current_user_email()
        -- OR if they are admin of the organization
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
-- COMMENTS
-- =============================================
COMMENT ON FUNCTION get_current_user_email() IS
    'Extracts email directly from JWT token. No table access needed.';
