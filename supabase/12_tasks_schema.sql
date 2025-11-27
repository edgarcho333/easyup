-- =====================================================
-- TASKS + COMMENTS + ATTACHMENTS SCHEMA
-- Migration 12: Task Management System
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TASKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),

  -- Multiple assignees support (array of user IDs)
  assigned_to UUID[] DEFAULT '{}',

  -- Timeline fields
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,

  -- Dependencies (array of task IDs)
  dependencies UUID[] DEFAULT '{}',

  -- Workload tracking
  effort INTEGER,
  effort_unit TEXT CHECK (effort_unit IN ('hours', 'points')),

  -- Checklist (stored as JSONB)
  checklist JSONB DEFAULT '[]',

  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks USING GIN (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tasks_updated_at ON public.tasks;
CREATE TRIGGER trigger_update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

-- =====================================================
-- 2. TASK COMMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user ON public.task_comments(user_id);

-- =====================================================
-- 3. TASK ATTACHMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON public.task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON public.task_attachments(uploaded_by);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "authenticated_users_can_read_tasks" ON public.tasks;
DROP POLICY IF EXISTS "authenticated_users_can_create_tasks" ON public.tasks;
DROP POLICY IF EXISTS "task_participants_can_update_tasks" ON public.tasks;
DROP POLICY IF EXISTS "task_creator_can_delete_tasks" ON public.tasks;
DROP POLICY IF EXISTS "authenticated_users_can_read_task_comments" ON public.task_comments;
DROP POLICY IF EXISTS "users_can_create_task_comments" ON public.task_comments;
DROP POLICY IF EXISTS "users_can_delete_own_task_comments" ON public.task_comments;
DROP POLICY IF EXISTS "authenticated_users_can_read_task_attachments" ON public.task_attachments;
DROP POLICY IF EXISTS "users_can_create_task_attachments" ON public.task_attachments;
DROP POLICY IF EXISTS "uploader_can_delete_attachments" ON public.task_attachments;

-- =====================================================
-- TASKS POLICIES
-- =====================================================

-- Anyone authenticated can read tasks (simplified for now)
CREATE POLICY "authenticated_users_can_read_tasks" ON public.tasks
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Authenticated users can create tasks (simplified)
CREATE POLICY "authenticated_users_can_create_tasks" ON public.tasks
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Task creator or assignees can update tasks
CREATE POLICY "task_participants_can_update_tasks" ON public.tasks
  FOR UPDATE
  USING (
    auth.uid() = created_by
    OR auth.uid() = ANY(assigned_to)
  );

-- Task creator can delete tasks
CREATE POLICY "task_creator_can_delete_tasks" ON public.tasks
  FOR DELETE
  USING (auth.uid() = created_by);

-- =====================================================
-- TASK COMMENTS POLICIES
-- =====================================================

-- Anyone authenticated can read comments
CREATE POLICY "authenticated_users_can_read_task_comments" ON public.task_comments
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can create comments
CREATE POLICY "users_can_create_task_comments" ON public.task_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "users_can_delete_own_task_comments" ON public.task_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TASK ATTACHMENTS POLICIES
-- =====================================================

-- Anyone authenticated can read attachments
CREATE POLICY "authenticated_users_can_read_task_attachments" ON public.task_attachments
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can upload attachments
CREATE POLICY "users_can_create_task_attachments" ON public.task_attachments
  FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

-- Uploader can delete attachments
CREATE POLICY "uploader_can_delete_attachments" ON public.task_attachments
  FOR DELETE
  USING (auth.uid() = uploaded_by);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.tasks IS 'Project tasks with multiple assignees, dependencies, and workload tracking';
COMMENT ON TABLE public.task_comments IS 'Comments on tasks for collaboration';
COMMENT ON TABLE public.task_attachments IS 'File attachments for tasks';
COMMENT ON COLUMN public.tasks.assigned_to IS 'Array of user IDs (multiple assignees support)';
COMMENT ON COLUMN public.tasks.dependencies IS 'Array of task IDs that must complete before this task';
COMMENT ON COLUMN public.tasks.checklist IS 'JSONB array of checklist items: [{id, text, completed}]';
COMMENT ON COLUMN public.tasks.effort IS 'Estimated effort (hours or story points)';
