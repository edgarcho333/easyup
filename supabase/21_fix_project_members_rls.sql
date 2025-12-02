-- =============================================
-- FIX PROJECT MEMBERS RLS FOR INVITATION ACCEPTANCE
-- Allow users to add themselves when accepting an invitation
-- =============================================

-- Allow users to add themselves to a project if they have a valid pending invitation
DROP POLICY IF EXISTS "users_can_join_via_invitation" ON public.project_members;
CREATE POLICY "users_can_join_via_invitation" ON public.project_members
  FOR INSERT
  WITH CHECK (
    -- User is adding themselves
    auth.uid() = user_id
    AND (
      -- They have a pending invitation to this project
      EXISTS (
        SELECT 1 FROM public.invitations
        WHERE invitations.project_id = project_members.project_id
          AND invitations.email = (SELECT email FROM auth.users WHERE id = auth.uid())
          AND invitations.status = 'pending'
      )
      OR
      -- Or they're being added by a lead/creator (original policy logic)
      (
        auth.uid() = added_by
        AND (
          EXISTS (
            SELECT 1 FROM public.projects
            WHERE id = project_members.project_id
              AND created_by = auth.uid()
          )
          OR
          EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = project_members.project_id
              AND pm.user_id = auth.uid()
              AND pm.is_lead = TRUE
          )
        )
      )
    )
  );

-- =============================================
-- FIX INVITATIONS UPDATE RLS
-- Allow users to accept their own invitations
-- =============================================

DROP POLICY IF EXISTS "Users can accept their own invitations" ON public.invitations;
CREATE POLICY "Users can accept their own invitations" ON public.invitations
  FOR UPDATE
  USING (
    -- User can update invitation sent to their email
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
