-- ============================================
-- EASYUP Authentication Schema
-- ============================================
-- This schema handles user authentication, organizations, and roles
-- Supabase Auth handles the actual auth.users table

-- ============================================
-- 1. ROLES TABLE
-- ============================================
-- Defines all available roles in the system

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.roles IS 'System roles for users within organizations';

-- ============================================
-- 2. ORGANIZATIONS TABLE
-- ============================================
-- Each organization can have multiple users

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);

-- Add comment
COMMENT ON TABLE public.organizations IS 'Organizations/Agencies that use the platform';

-- ============================================
-- 3. USER_ORGANIZATIONS TABLE (Junction Table)
-- ============================================
-- Links users to organizations with specific roles

CREATE TABLE IF NOT EXISTS public.user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate memberships
  UNIQUE(user_id, organization_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON public.user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON public.user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_status ON public.user_organizations(status);

-- Add comment
COMMENT ON TABLE public.user_organizations IS 'Junction table linking users to organizations with roles';

-- ============================================
-- 4. UPDATED_AT TRIGGER
-- ============================================
-- Automatically update updated_at timestamp

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to organizations
CREATE TRIGGER set_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- Roles: Everyone can read roles (needed for registration)
CREATE POLICY "Roles are viewable by everyone"
  ON public.roles FOR SELECT
  USING (true);

-- Organizations: Users can view organizations they belong to
CREATE POLICY "Users can view their organizations"
  ON public.organizations FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_organizations
      WHERE organization_id = id AND status = 'active'
    )
  );

-- Organizations: Users can insert (needed for registration)
CREATE POLICY "Users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Organizations: Owners can update their organizations
CREATE POLICY "Organization owners can update"
  ON public.organizations FOR UPDATE
  USING (auth.uid() = owner_id);

-- Organizations: Owners can delete their organizations
CREATE POLICY "Organization owners can delete"
  ON public.organizations FOR DELETE
  USING (auth.uid() = owner_id);

-- User Organizations: Users can view their own memberships
CREATE POLICY "Users can view their memberships"
  ON public.user_organizations FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    auth.uid() IN (
      SELECT owner_id FROM public.organizations WHERE id = organization_id
    )
  );

-- User Organizations: Users can insert (needed for registration)
CREATE POLICY "Users can create memberships"
  ON public.user_organizations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR
    auth.uid() IN (
      SELECT owner_id FROM public.organizations WHERE id = organization_id
    )
  );

-- User Organizations: Org owners can update memberships
CREATE POLICY "Organization owners can update memberships"
  ON public.user_organizations FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.organizations WHERE id = organization_id
    )
  );

-- User Organizations: Org owners can delete memberships
CREATE POLICY "Organization owners can delete memberships"
  ON public.user_organizations FOR DELETE
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.organizations WHERE id = organization_id
    )
  );
