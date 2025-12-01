import { supabase } from '../lib/supabase';
import { Project, ProjectMember, ProjectStatus } from '../types';
import { notificationService } from './notificationService';

export const projectService = {
  async getProjects(organizationId: string, statusFilter?: ProjectStatus): Promise<Project[]> {
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .eq('organization_id', organizationId);

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data: projects, error } = await query.order('updated_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch projects:', error.message);
        throw new Error(`Failed to fetch projects: ${error.message}`);
      }

      if (!projects) return [];

      // Fetch members for each project
      const projectsWithMembers = await Promise.all(
        projects.map(async (project) => {
          const { data: members, error: membersError } = await supabase
            .from('project_members')
            .select('id, project_id, user_id, role_id, is_lead, added_at')
            .eq('project_id', project.id);

          if (membersError) {
            console.error('Failed to fetch project members:', membersError.message);
            return { ...project, members: [] };
          }

          // Fetch user and role info separately
          const formattedMembers = await Promise.all(
            (members || []).map(async (m: any) => {
              const { data: user } = await supabase
                .from('users')
                .select('id, email, full_name, avatar_url')
                .eq('id', m.user_id)
                .maybeSingle();

              const { data: role } = await supabase
                .from('roles')
                .select('id, name, display_name')
                .eq('id', m.role_id)
                .maybeSingle();

              return {
                id: m.id,
                project_id: m.project_id,
                user_id: m.user_id,
                role_id: m.role_id,
                is_lead: m.is_lead,
                added_at: m.added_at,
                user: user || undefined,
                role: role || undefined
              };
            })
          );

          return { ...project, members: formattedMembers };
        })
      );

      return projectsWithMembers;
    } catch (err) {
      console.error('Error in getProjects:', err);
      throw err;
    }
  },

  async getProject(projectId: string): Promise<Project> {
    try {
      console.log('🔵 [projectService] getProject called for:', projectId);
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Failed to fetch project:', error.message);
        throw new Error('Project not found');
      }

      if (!project) {
        throw new Error('Project not found');
      }

      // Fetch project members
      const { data: members, error: membersError } = await supabase
        .from('project_members')
        .select('id, project_id, user_id, role_id, is_lead, added_at')
        .eq('project_id', projectId);

      console.log('🔵 [projectService] project_members result:', { members, membersError });

      if (membersError) {
        console.error('Failed to fetch project members:', membersError.message);
        return { ...project, members: [] };
      }

      // Fetch user and role info separately for each member
      const formattedMembers = await Promise.all(
        (members || []).map(async (m: any) => {
          // Get user info
          const { data: user } = await supabase
            .from('users')
            .select('id, email, full_name, avatar_url')
            .eq('id', m.user_id)
            .maybeSingle();

          // Get role info
          const { data: role } = await supabase
            .from('roles')
            .select('id, name, display_name')
            .eq('id', m.role_id)
            .maybeSingle();

          return {
            id: m.id,
            project_id: m.project_id,
            user_id: m.user_id,
            role_id: m.role_id,
            is_lead: m.is_lead,
            added_at: m.added_at,
            user: user || undefined,
            role: role || undefined
          };
        })
      );

      return { ...project, members: formattedMembers };
    } catch (err) {
      console.error('Error in getProject:', err);
      throw err;
    }
  },

  async createProject(
    organizationId: string,
    creatorId: string,
    projectData: {
      name: string;
      client_name: string;
      description?: string;
      monthly_post_target?: number;
      total_budget?: number;
    },
    assignedMembers: { userId: string; roleId: string }[],
    clientInvite?: { email: string; name: string }
  ): Promise<string> {
    try {
      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          organization_id: organizationId,
          created_by: creatorId,
          name: projectData.name,
          client_name: projectData.client_name,
          description: projectData.description,
          monthly_post_target: projectData.monthly_post_target || 8,
          total_budget: projectData.total_budget,
          status: 'setup'
        })
        .select()
        .single();

      if (projectError) {
        console.error('Failed to create project:', projectError.message);
        throw new Error(`Failed to create project: ${projectError.message}`);
      }

      if (!project) {
        throw new Error('No project returned from insert');
      }

      // Get creator's role in organization (to use in project)
      const { data: creatorMembership } = await supabase
        .from('user_organizations')
        .select('role_id')
        .eq('user_id', creatorId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      // Always add creator as project member
      const membersToInsert = assignedMembers.map(m => ({
        project_id: project.id,
        user_id: m.userId,
        role_id: m.roleId,
        added_by: creatorId
      }));

      // Add creator if not already in the list
      const creatorAlreadyIncluded = assignedMembers.some(m => m.userId === creatorId);
      if (!creatorAlreadyIncluded && creatorMembership?.role_id) {
        membersToInsert.push({
          project_id: project.id,
          user_id: creatorId,
          role_id: creatorMembership.role_id,
          added_by: creatorId
        });
      }

      if (membersToInsert.length > 0) {
        const { error: membersError } = await supabase
          .from('project_members')
          .insert(membersToInsert);

        if (membersError) {
          console.error('Failed to add project members:', membersError.message);
          // Don't throw, project was created successfully
        }
      }

      // --- NOTIFICATION TRIGGER ---
      // Get creator details for notification
      const { data: userData } = await supabase.auth.getUser();
      const fullName = userData?.user?.user_metadata?.full_name || 'Someone';

      await notificationService.createNotification({
        user_id: creatorId,
        organization_id: organizationId,
        type: 'project_created',
        title: 'New Project Created',
        message: `${fullName} created a new project: ${projectData.name} for ${projectData.client_name}`,
        link_url: `/projects/${project.id}`
      });

      return project.id;
    } catch (err) {
      console.error('Error in createProject:', err);
      throw err;
    }
  },

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);

      if (error) {
        console.error('Failed to update project:', error.message);
        throw new Error(`Failed to update project: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in updateProject:', err);
      throw err;
    }
  },

  async archiveProject(projectId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          status: 'archived',
          archived_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) {
        console.error('Failed to archive project:', error.message);
        throw new Error(`Failed to archive project: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in archiveProject:', err);
      throw err;
    }
  }
};
