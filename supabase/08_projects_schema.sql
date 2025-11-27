-- =====================================================
-- PROJECTS + PROJECT MEMBERS SCHEMA
-- Migration 08: Projects and Project Membership
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROJECTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  client_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'on_hold', 'completed', 'archived')),
  monthly_post_target INTEGER DEFAULT 8,
  total_budget NUMERIC(10, 2),
  settings JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_organization ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_projects_updated_at ON public.projects;
CREATE TRIGGER trigger_update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- =====================================================
-- 2. PROJECT MEMBERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id),
  is_lead BOOLEAN DEFAULT FALSE,
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate memberships
  UNIQUE(project_id, user_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "authenticated_users_can_read_projects" ON public.projects;
DROP POLICY IF EXISTS "users_can_create_projects" ON public.projects;
DROP POLICY IF EXISTS "users_can_update_own_projects" ON public.projects;
DROP POLICY IF EXISTS "creator_can_delete_projects" ON public.projects;
DROP POLICY IF EXISTS "authenticated_users_can_read_project_members" ON public.project_members;
DROP POLICY IF EXISTS "leads_can_add_members" ON public.project_members;
DROP POLICY IF EXISTS "leads_can_update_members" ON public.project_members;
DROP POLICY IF EXISTS "leads_can_remove_members" ON public.project_members;

-- =====================================================
-- PROJECTS POLICIES
-- =====================================================

-- Anyone authenticated can read projects (simplified for now, can restrict later)
CREATE POLICY "authenticated_users_can_read_projects" ON public.projects
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can create projects in their organization
CREATE POLICY "users_can_create_projects" ON public.projects
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.user_organizations
      WHERE user_id = auth.uid()
        AND organization_id = projects.organization_id
        AND status = 'active'
    )
  );

-- Users can update projects they created or are members of
CREATE POLICY "users_can_update_own_projects" ON public.projects
  FOR UPDATE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = projects.id
        AND user_id = auth.uid()
    )
  );

-- Only creator can delete/archive projects
CREATE POLICY "creator_can_delete_projects" ON public.projects
  FOR DELETE
  USING (auth.uid() = created_by);

-- =====================================================
-- PROJECT MEMBERS POLICIES
-- =====================================================

-- Anyone authenticated can read project members
CREATE POLICY "authenticated_users_can_read_project_members" ON public.project_members
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can add members to projects they created or are leads of
CREATE POLICY "leads_can_add_members" ON public.project_members
  FOR INSERT
  WITH CHECK (
    auth.uid() = added_by
    AND (
      -- User created the project
      EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = project_members.project_id
          AND created_by = auth.uid()
      )
      OR
      -- User is a lead on the project
      EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = project_members.project_id
          AND pm.user_id = auth.uid()
          AND pm.is_lead = TRUE
      )
    )
  );

-- Users can update memberships they added or if they're project creator/lead
CREATE POLICY "leads_can_update_members" ON public.project_members
  FOR UPDATE
  USING (
    auth.uid() = added_by
    OR EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_members.project_id
        AND created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.is_lead = TRUE
    )
  );

-- Users can remove members they added or if they're project creator/lead
CREATE POLICY "leads_can_remove_members" ON public.project_members
  FOR DELETE
  USING (
    auth.uid() = added_by
    OR EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_members.project_id
        AND created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.is_lead = TRUE
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.projects IS 'Projects belong to organizations and contain ideas, tasks, etc.';
COMMENT ON TABLE public.project_members IS 'Junction table for project team membership';
COMMENT ON COLUMN public.projects.settings IS 'JSONB field for project-specific settings (workflow, permissions, notifications)';
COMMENT ON COLUMN public.project_members.is_lead IS 'Project leads have additional permissions';
