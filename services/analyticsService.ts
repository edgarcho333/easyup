
import { mockDb } from '../lib/mockDb';
import { ActivityLog, AnalyticsSummary, ChartData, GeneratedReport, CurrentUser } from '../types';

export const analyticsService = {
  async getOrganizationStats(organizationId: string): Promise<AnalyticsSummary> {
    const projects = mockDb.filter('projects', (p: any) => p.organization_id === organizationId);
    const activeProjects = projects.filter((p: any) => p.status === 'active');
    
    const projectIds = projects.map((p: any) => p.id);
    
    let totalIdeas = 0;
    let approvedIdeas = 0;
    let tasksCompleted = 0;

    if (projectIds.length > 0) {
        const ideas = mockDb.filter('ideas', (i: any) => projectIds.includes(i.project_id));
        totalIdeas = ideas.length;
        approvedIdeas = ideas.filter((i: any) => i.status === 'approved').length;

        const tasks = mockDb.filter('tasks', (t: any) => projectIds.includes(t.project_id));
        tasksCompleted = tasks.filter((t: any) => t.status === 'done').length;
    }

    return {
        total_projects: projects.length,
        active_projects: activeProjects.length,
        total_ideas: totalIdeas,
        approved_ideas: approvedIdeas,
        approval_rate: totalIdeas > 0 ? Math.round((approvedIdeas / totalIdeas) * 100) : 0,
        tasks_completed: tasksCompleted
    };
  },

  async getActivityLogs(organizationId: string, limit = 20): Promise<ActivityLog[]> {
    const logs = mockDb.filter('activity_logs', (l: any) => l.organization_id === organizationId);
    return logs.map((l: any) => ({
        ...l,
        user: mockDb.find('users', (u: any) => u.id === l.user_id)
    })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limit);
  },

  async getProjectActivityLogs(projectId: string): Promise<ActivityLog[]> {
    const logs = mockDb.filter('activity_logs', (l: any) => l.project_id === projectId);
    
    // We need to join User AND their Role in this organization to filter by Client vs Staff
    // This mimics a complex join
    return logs.map((l: any) => {
        const user = mockDb.find('users', (u: any) => u.id === l.user_id);
        let userWithRole: any = user;

        if (user) {
            // Find membership for this org to get role
            const membership = mockDb.find('user_organizations', (uo: any) => 
                uo.user_id === user.id && uo.organization_id === l.organization_id
            );
            
            if (membership) {
                const role = mockDb.find('roles', (r: any) => r.id === membership.role_id);
                userWithRole = {
                    ...user,
                    currentRole: role?.name || 'member'
                };
            }
        }

        return {
            ...l,
            user: userWithRole
        };
    }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getIdeaTrends(organizationId: string): Promise<ChartData[]> {
    // Mock Data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(m => ({
        name: m,
        value: Math.floor(Math.random() * 50) + 10
    }));
  },

  async logActivity(
    organizationId: string, 
    userId: string, 
    actionType: string, 
    entityType: string, 
    entityId?: string, 
    details?: any,
    projectId?: string
  ): Promise<void> {
    mockDb.insert('activity_logs', {
        organization_id: organizationId,
        user_id: userId,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        details,
        project_id: projectId
    });
  },

  async getGeneratedReports(organizationId: string): Promise<GeneratedReport[]> {
    return [];
  },

  async generateReport(
    organizationId: string, 
    userId: string, 
    config: { type: string, format: string, dateRange: string }
  ): Promise<GeneratedReport> {
    return {
        id: 'rep-' + Date.now(),
        name: 'Mock Report',
        type: config.format as any,
        date_range: config.dateRange,
        file_url: '#',
        created_by: userId,
        created_at: new Date().toISOString()
    };
  }
};