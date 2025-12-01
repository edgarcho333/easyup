-- =============================================
-- INVITATIONS SCHEMA
-- =============================================

-- Invitations table for organization member invites
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    personal_message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Organization admins can view invitations
CREATE POLICY "Admins can view organization invitations"
    ON invitations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            JOIN roles r ON r.id = uo.role_id
            WHERE uo.organization_id = invitations.organization_id
            AND uo.user_id = auth.uid()
            AND uo.status = 'active'
            AND r.name IN ('super_admin', 'account_manager')
        )
    );

-- Users can view their own invitations (by email)
CREATE POLICY "Users can view their own invitations"
    ON invitations FOR SELECT
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Organization admins can create invitations
CREATE POLICY "Admins can create invitations"
    ON invitations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            JOIN roles r ON r.id = uo.role_id
            WHERE uo.organization_id = invitations.organization_id
            AND uo.user_id = auth.uid()
            AND uo.status = 'active'
            AND r.name IN ('super_admin', 'account_manager')
        )
    );

-- Organization admins can update invitations
CREATE POLICY "Admins can update invitations"
    ON invitations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            JOIN roles r ON r.id = uo.role_id
            WHERE uo.organization_id = invitations.organization_id
            AND uo.user_id = auth.uid()
            AND uo.status = 'active'
            AND r.name IN ('super_admin', 'account_manager')
        )
    );

-- Organization admins can delete invitations
CREATE POLICY "Admins can delete invitations"
    ON invitations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            JOIN roles r ON r.id = uo.role_id
            WHERE uo.organization_id = invitations.organization_id
            AND uo.user_id = auth.uid()
            AND uo.status = 'active'
            AND r.name IN ('super_admin', 'account_manager')
        )
    );
