-- =====================================================
-- IDEAS + COMMENTS + APPROVALS SCHEMA
-- Migration 10: Content Ideas Workflow
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. IDEAS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  reference_image_url TEXT,
  planned_post_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'pending_approval',
    'in_production',
    'pending_final_review',
    'scheduled',
    'published',
    'changes_requested',
    'rejected'
  )),
  post_type TEXT NOT NULL CHECK (post_type IN ('image', 'video', 'carousel', 'story', 'reel')),
  platforms TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_ideas_project ON public.ideas(project_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON public.ideas(status);
CREATE INDEX IF NOT EXISTS idx_ideas_created_by ON public.ideas(created_by);
CREATE INDEX IF NOT EXISTS idx_ideas_planned_date ON public.ideas(planned_post_date);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ideas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ideas_updated_at
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_ideas_updated_at();

-- =====================================================
-- 2. IDEA COMMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.idea_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_idea_comments_idea ON public.idea_comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_comments_user ON public.idea_comments(user_id);

-- =====================================================
-- 3. IDEA APPROVALS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.idea_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES auth.users(id),
  approver_role TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'requested_changes')),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_idea_approvals_idea ON public.idea_approvals(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_approvals_approver ON public.idea_approvals(approver_id);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_approvals ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- IDEAS POLICIES
-- =====================================================

-- Anyone authenticated can read ideas (can be restricted later by project membership)
CREATE POLICY "authenticated_users_can_read_ideas" ON public.ideas
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can create ideas in projects they are members of
CREATE POLICY "project_members_can_create_ideas" ON public.ideas
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = ideas.project_id
        AND user_id = auth.uid()
    )
  );

-- Users can update ideas they created or are project members
CREATE POLICY "creators_and_members_can_update_ideas" ON public.ideas
  FOR UPDATE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = ideas.project_id
        AND user_id = auth.uid()
    )
  );

-- Users can delete ideas they created
CREATE POLICY "creators_can_delete_ideas" ON public.ideas
  FOR DELETE
  USING (auth.uid() = created_by);

-- =====================================================
-- IDEA COMMENTS POLICIES
-- =====================================================

-- Anyone authenticated can read comments
CREATE POLICY "authenticated_users_can_read_comments" ON public.idea_comments
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can create comments
CREATE POLICY "users_can_create_comments" ON public.idea_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "users_can_delete_own_comments" ON public.idea_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- IDEA APPROVALS POLICIES
-- =====================================================

-- Anyone authenticated can read approvals
CREATE POLICY "authenticated_users_can_read_approvals" ON public.idea_approvals
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can create approvals
CREATE POLICY "users_can_create_approvals" ON public.idea_approvals
  FOR INSERT
  WITH CHECK (auth.uid() = approver_id);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.ideas IS 'Content ideas with approval workflow';
COMMENT ON TABLE public.idea_comments IS 'Comments on ideas for collaboration';
COMMENT ON TABLE public.idea_approvals IS 'Approval history for ideas';
COMMENT ON COLUMN public.ideas.platforms IS 'Array of platforms: facebook, instagram, tiktok, linkedin, twitter';
COMMENT ON COLUMN public.ideas.status IS 'Workflow status: draft → pending_approval → in_production → pending_final_review → scheduled → published';
