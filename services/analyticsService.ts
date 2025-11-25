

import { mockDb } from '../lib/mockDb';
import { ActivityLog, AnalyticsSummary, ChartData, GeneratedReport, CurrentUser, EmployeePerformanceMetrics, VelocityMetric, WorkloadDistribution } from '../types';

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
  },

  // NEW: Comprehensive Employee Performance Aggregation
  async getEmployeePerformance(organizationId: string): Promise<EmployeePerformanceMetrics[]> {
    // Get all members of org
    const memberships = mockDb.filter('user_organizations', (uo: any) => uo.organization_id === organizationId && uo.status === 'active');
    
    return memberships.map((m: any) => {
        const user = mockDb.find('users', (u: any) => u.id === m.user_id);
        const role = mockDb.find('roles', (r: any) => r.id === m.role_id);
        
        if (!user) return null;

        // 1. Calculate Time Logs (Attendance)
        const logs = mockDb.filter('time_logs', (l: any) => l.user_id === user.id);
        const todayLogs = logs.filter((l: any) => new Date(l.start_time).toDateString() === new Date().toDateString());
        
        // Calculate Lateness (Assume 10:00 AM start)
        let latenessCount = 0;
        let avgLateness = 0;
        // Mock Logic: Randomly assign lateness to simulate real data
        if (Math.random() > 0.7) {
            latenessCount = Math.floor(Math.random() * 3) + 1;
            avgLateness = Math.floor(Math.random() * 45);
        }

        // Active Status
        const activeLog = logs.find((l: any) => !l.end_time);
        let currentStatus: 'working' | 'idle' | 'offline' = 'offline';
        let currentTask = undefined;
        let currentProject = undefined;

        if (activeLog) {
            currentStatus = 'working';
            if (activeLog.task_id) {
               const t = mockDb.find('tasks', (task: any) => task.id === activeLog.task_id);
               currentTask = t?.title;
            }
            if (activeLog.project_id) {
                const p = mockDb.find('projects', (proj: any) => proj.id === activeLog.project_id);
                currentProject = p?.name;
            } else {
                currentTask = activeLog.description;
            }
        } else {
            // Mock idle status for some users
            if (Math.random() > 0.8) currentStatus = 'idle'; 
        }

        // 2. Task Performance
        const tasks = mockDb.filter('tasks', (t: any) => t.assigned_to && t.assigned_to.includes(user.id));
        const completed = tasks.filter((t: any) => t.status === 'done').length;
        const overdue = tasks.filter((t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length;
        const onTime = completed - (overdue > 0 ? Math.floor(overdue / 2) : 0); // Mock calc
        const efficiency = tasks.length > 0 ? Math.round(((tasks.length - overdue) / tasks.length) * 100) : 100;
        const activeTaskCount = tasks.filter((t: any) => t.status !== 'done').length;

        // 3. Chat Metrics (Mocked)
        const chatResponseTime = Math.floor(Math.random() * 60) + 2; // 2 to 60 mins
        
        return {
            user_id: user.id,
            user_name: user.full_name,
            user_avatar: user.avatar_url,
            user_role: role?.display_name || 'Member',
            attendance_score: 100 - (latenessCount * 5),
            lateness_count: latenessCount,
            avg_lateness_minutes: avgLateness,
            current_status: currentStatus,
            current_task: currentTask,
            current_project: currentProject,
            total_hours_today: todayLogs.reduce((acc: number, l: any) => acc + (l.duration_minutes || 0), 0) / 60,
            tasks_completed_on_time: onTime,
            tasks_overdue: overdue,
            task_efficiency_rate: efficiency,
            active_task_count: activeTaskCount,
            avg_chat_response_time_minutes: chatResponseTime,
            missed_messages_count: Math.floor(Math.random() * 5)
        };
    }).filter(Boolean) as EmployeePerformanceMetrics[];
  },

  async getTeamVelocity(organizationId: string): Promise<VelocityMetric[]> {
    // Mock Velocity Data
    return [
      { sprint_name: 'Sprint 20', planned_points: 30, completed_points: 28 },
      { sprint_name: 'Sprint 21', planned_points: 35, completed_points: 32 },
      { sprint_name: 'Sprint 22', planned_points: 35, completed_points: 35 },
      { sprint_name: 'Sprint 23', planned_points: 40, completed_points: 38 },
      { sprint_name: 'Sprint 24', planned_points: 40, completed_points: 25 }, // Dip
      { sprint_name: 'Sprint 25', planned_points: 45, completed_points: 42 },
    ];
  },

  async getWorkloadDistribution(organizationId: string): Promise<WorkloadDistribution[]> {
    // Mock Distribution
    return [
      { status: 'todo', count: 24 },
      { status: 'in_progress', count: 18 },
      { status: 'review', count: 8 },
      { status: 'done', count: 45 },
    ];
  }
};