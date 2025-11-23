
import { mockDb } from '../lib/mockDb';
import { Project, ProjectMember, ProjectStatus } from '../types';

export const projectService = {
  async getProjects(organizationId: string, statusFilter?: ProjectStatus): Promise<Project[]> {
    let projects = mockDb.filter('projects', (p: any) => p.organization_id === organizationId);

    if (statusFilter) {
      projects = projects.filter((p: any) => p.status === statusFilter);
    }

    // Attach members
    return projects.map((p: any) => {
      const members = mockDb.filter('project_members', (pm: any) => pm.project_id === p.id);
      return { ...p, members };
    }).sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  },

  async getProject(projectId: string): Promise<Project> {
    const project: any = mockDb.find('projects', (p: any) => p.id === projectId);
    if (!project) throw new Error("Project not found");

    const members = mockDb.filter('project_members', (pm: any) => pm.project_id === projectId);
    const membersWithDetails = members.map((m: any) => {
        const user = mockDb.find('users', (u: any) => u.id === m.user_id);
        const role = mockDb.find('roles', (r: any) => r.id === m.role_id);
        return { ...m, user, role };
    });

    return { ...project, members: membersWithDetails };
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
    
    const project = mockDb.insert<Project>('projects', {
      organization_id: organizationId,
      created_by: creatorId,
      name: projectData.name,
      client_name: projectData.client_name,
      description: projectData.description,
      monthly_post_target: projectData.monthly_post_target || 8,
      total_budget: projectData.total_budget,
      status: 'setup'
    });

    assignedMembers.forEach(m => {
      mockDb.insert('project_members', {
        project_id: project.id,
        user_id: m.userId,
        role_id: m.roleId,
        added_by: creatorId
      });
    });

    return project.id;
  },

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    mockDb.update('projects', projectId, updates);
  },

  async archiveProject(projectId: string): Promise<void> {
    mockDb.update('projects', projectId, { 
      status: 'archived', 
      archived_at: new Date().toISOString() 
    });
  }
};
