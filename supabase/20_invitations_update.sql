-- =============================================
-- INVITATIONS SCHEMA UPDATE
-- Add token, expires_at, project_id fields
-- =============================================

-- Add new columns to invitations table
ALTER TABLE invitations
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days');

-- Update status check constraint to include 'expired'
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_status_check;
ALTER TABLE invitations ADD CONSTRAINT invitations_status_check
    CHECK (status IN ('pending', 'accepted', 'cancelled', 'expired'));

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);

-- =============================================
-- UPDATED ROW LEVEL SECURITY
-- =============================================

-- Allow anyone to read invitation by token (for invite landing page)
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON invitations;
CREATE POLICY "Anyone can view invitation by token"
    ON invitations FOR SELECT
    USING (token IS NOT NULL);

-- Users can accept invitations (update status)
DROP POLICY IF EXISTS "Users can accept invitations" ON invitations;
CREATE POLICY "Users can accept invitations"
    ON invitations FOR UPDATE
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM user_organizations uo
            JOIN roles r ON r.id = uo.role_id
            WHERE uo.organization_id = invitations.organization_id
            AND uo.user_id = auth.uid()
            AND uo.status = 'active'
            AND r.name IN ('super_admin', 'account_manager')
        )
    );
