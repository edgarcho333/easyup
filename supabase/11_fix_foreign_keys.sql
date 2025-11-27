-- =====================================================
-- FIX FOREIGN KEY RELATIONSHIPS
-- Migration 11: Update FKs to reference public.users
-- =====================================================

-- =====================================================
-- 1. DROP OLD CONSTRAINTS
-- =====================================================

-- Drop ideas foreign key to auth.users
ALTER TABLE public.ideas
  DROP CONSTRAINT IF EXISTS ideas_created_by_fkey;

-- Drop idea_comments foreign key to auth.users
ALTER TABLE public.idea_comments
  DROP CONSTRAINT IF EXISTS idea_comments_user_id_fkey;

-- Drop idea_approvals foreign key to auth.users
ALTER TABLE public.idea_approvals
  DROP CONSTRAINT IF EXISTS idea_approvals_approver_id_fkey;

-- Drop project_members foreign keys to auth.users
ALTER TABLE public.project_members
  DROP CONSTRAINT IF EXISTS project_members_user_id_fkey;

ALTER TABLE public.project_members
  DROP CONSTRAINT IF EXISTS project_members_added_by_fkey;

-- Drop projects foreign key to auth.users
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_created_by_fkey;

-- =====================================================
-- 2. ADD NEW CONSTRAINTS TO public.users
-- =====================================================

-- Ideas: created_by → public.users
ALTER TABLE public.ideas
  ADD CONSTRAINT ideas_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- Idea Comments: user_id → public.users
ALTER TABLE public.idea_comments
  ADD CONSTRAINT idea_comments_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- Idea Approvals: approver_id → public.users
ALTER TABLE public.idea_approvals
  ADD CONSTRAINT idea_approvals_approver_id_fkey
  FOREIGN KEY (approver_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- Project Members: user_id → public.users
ALTER TABLE public.project_members
  ADD CONSTRAINT project_members_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- Project Members: added_by → public.users (nullable)
ALTER TABLE public.project_members
  ADD CONSTRAINT project_members_added_by_fkey
  FOREIGN KEY (added_by)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

-- Projects: created_by → public.users
ALTER TABLE public.projects
  ADD CONSTRAINT projects_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON CONSTRAINT ideas_created_by_fkey ON public.ideas IS 'References public.users instead of auth.users for JOIN compatibility';
COMMENT ON CONSTRAINT project_members_user_id_fkey ON public.project_members IS 'References public.users instead of auth.users for JOIN compatibility';
