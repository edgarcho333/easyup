import { supabase } from '../lib/supabase';
import { ActivityLog, AnalyticsSummary, ChartData, GeneratedReport, EmployeePerformanceMetrics, VelocityMetric, WorkloadDistribution } from '../types';

export const analyticsService = {
  async getOrganizationStats(organizationId: string): Promise<AnalyticsSummary> {
    // Get projects count
    const { count: totalProjects } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    const { count: activeProjects } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    // Get project IDs for this org
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('organization_id', organizationId);

    const projectIds = projects?.map(p => p.id) || [];

    let totalIdeas = 0;
    let approvedIdeas = 0;
    let tasksCompleted = 0;

    if (projectIds.length > 0) {
      const { count: ideasCount } = await supabase
        .from('ideas')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds);

      const { count: approvedCount } = await supabase
        .from('ideas')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .in('status', ['scheduled', 'published']);

      const { count: doneTasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .eq('status', 'done');

      totalIdeas = ideasCount || 0;
      approvedIdeas = approvedCount || 0;
      tasksCompleted = doneTasksCount || 0;
    }

    return {
      total_projects: totalProjects || 0,
      active_projects: activeProjects || 0,
      total_ideas: totalIdeas,
      approved_ideas: approvedIdeas,
      approval_rate: totalIdeas > 0 ? Math.round((approvedIdeas / totalIdeas) * 100) : 0,
      tasks_completed: tasksCompleted
    };
  },

  async getActivityLogs(organizationId: string, limit = 20): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activity logs:', error);
      return [];
    }

    // Fetch user info separately for each log
    const logsWithUsers = await Promise.all(
      (data || []).map(async (l: any) => {
        let user = undefined;
        if (l.user_id) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, full_name, avatar_url')
            .eq('id', l.user_id)
            .maybeSingle();
          user = userData || undefined;
        }
        return { ...l, user };
      })
    );

    return logsWithUsers;
  },

  async getProjectActivityLogs(projectId: string): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching project activity logs:', error);
      return [];
    }

    // For each log, get user info and role
    const logsWithUsers = await Promise.all(
      (data || []).map(async (l: any) => {
        // Get user info
        const { data: user } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url')
          .eq('id', l.user_id)
          .maybeSingle();

        let currentRole = 'member';
        if (user && l.organization_id) {
          // Get membership and role separately
          const { data: membership } = await supabase
            .from('user_organizations')
            .select('role_id')
            .eq('user_id', user.id)
            .eq('organization_id', l.organization_id)
            .maybeSingle();

          if (membership?.role_id) {
            const { data: role } = await supabase
              .from('roles')
              .select('name')
              .eq('id', membership.role_id)
              .maybeSingle();
            currentRole = role?.name || 'member';
          }
        }

        return {
          ...l,
          user: user ? { ...user, currentRole } : undefined
        };
      })
    );

    return logsWithUsers;
  },

  async getIdeaTrends(organizationId: string): Promise<ChartData[]> {
    // Get ideas by month for the last 6 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const now = new Date();
    const results: ChartData[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = date.toISOString();
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('organization_id', organizationId);

      const projectIds = projects?.map(p => p.id) || [];

      if (projectIds.length > 0) {
        const { count } = await supabase
          .from('ideas')
          .select('*', { count: 'exact', head: true })
          .in('project_id', projectIds)
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth);

        results.push({
          name: months[date.getMonth()],
          value: count || 0
        });
      } else {
        results.push({
          name: months[date.getMonth()],
          value: 0
        });
      }
    }

    return results;
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
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId || null,
        details: details || null,
        project_id: projectId || null
      });

    if (error) {
      console.error('Error logging activity:', error);
    }
  },

  async getGeneratedReports(organizationId: string): Promise<GeneratedReport[]> {
    // Reports feature not yet implemented with Supabase
    return [];
  },

  async generateReport(
    organizationId: string,
    userId: string,
    config: { type: string; format: string; dateRange: string }
  ): Promise<GeneratedReport> {
    // Mock report generation
    return {
      id: 'rep-' + Date.now(),
      name: 'Generated Report',
      type: config.format as any,
      date_range: config.dateRange,
      file_url: '#',
      created_by: userId,
      created_at: new Date().toISOString()
    };
  },

  async getEmployeePerformance(organizationId: string): Promise<EmployeePerformanceMetrics[]> {
    // Get all active members
    const { data: memberships, error } = await supabase
      .from('user_organizations')
      .select('user_id, role_id')
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (error || !memberships) {
      return [];
    }

    const metrics: EmployeePerformanceMetrics[] = [];

    for (const m of memberships) {
      // Fetch user info separately
      const { data: user } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .eq('id', m.user_id)
        .maybeSingle();

      // Fetch role info separately
      const { data: role } = await supabase
        .from('roles')
        .select('display_name')
        .eq('id', m.role_id)
        .maybeSingle();

      if (!user) continue;

      // Get time logs for today
      const today = new Date().toISOString().split('T')[0];
      const { data: todayLogs } = await supabase
        .from('time_logs')
        .select('duration_minutes, end_time')
        .eq('user_id', user.id)
        .gte('start_time', today);

      // Check for active log
      const activeLog = todayLogs?.find(l => !l.end_time);

      // Get tasks assigned to user
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, status, due_date')
        .contains('assigned_to', [user.id]);

      const completed = tasks?.filter(t => t.status === 'done').length || 0;
      const overdue = tasks?.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length || 0;
      const activeTaskCount = tasks?.filter(t => t.status !== 'done').length || 0;
      const totalTasks = tasks?.length || 0;
      const efficiency = totalTasks > 0 ? Math.round(((totalTasks - overdue) / totalTasks) * 100) : 100;

      // Mock lateness data (would need actual attendance system)
      const latenessCount = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0;
      const avgLateness = latenessCount > 0 ? Math.floor(Math.random() * 45) : 0;

      metrics.push({
        user_id: user.id,
        user_name: user.full_name || 'Unknown',
        user_avatar: user.avatar_url,
        user_role: role?.display_name || 'Member',
        attendance_score: 100 - (latenessCount * 5),
        lateness_count: latenessCount,
        avg_lateness_minutes: avgLateness,
        current_status: activeLog ? 'working' : (Math.random() > 0.8 ? 'idle' : 'offline'),
        current_task: undefined,
        current_project: undefined,
        total_hours_today: (todayLogs?.reduce((acc, l) => acc + (l.duration_minutes || 0), 0) || 0) / 60,
        tasks_completed_on_time: completed,
        tasks_overdue: overdue,
        task_efficiency_rate: efficiency,
        active_task_count: activeTaskCount,
        avg_chat_response_time_minutes: Math.floor(Math.random() * 60) + 2,
        missed_messages_count: Math.floor(Math.random() * 5)
      });
    }

    return metrics;
  },

  async getTeamVelocity(organizationId: string): Promise<VelocityMetric[]> {
    // Mock velocity data - would need sprint tracking feature
    return [
      { sprint_name: 'Sprint 20', planned_points: 30, completed_points: 28 },
      { sprint_name: 'Sprint 21', planned_points: 35, completed_points: 32 },
      { sprint_name: 'Sprint 22', planned_points: 35, completed_points: 35 },
      { sprint_name: 'Sprint 23', planned_points: 40, completed_points: 38 },
      { sprint_name: 'Sprint 24', planned_points: 40, completed_points: 25 },
      { sprint_name: 'Sprint 25', planned_points: 45, completed_points: 42 }
    ];
  },

  async getWorkloadDistribution(organizationId: string): Promise<WorkloadDistribution[]> {
    // Get all projects for org
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('organization_id', organizationId);

    const projectIds = projects?.map(p => p.id) || [];

    if (projectIds.length === 0) {
      return [
        { status: 'todo', count: 0 },
        { status: 'in_progress', count: 0 },
        { status: 'review', count: 0 },
        { status: 'done', count: 0 }
      ];
    }

    const statuses: Array<'todo' | 'in_progress' | 'review' | 'done'> = ['todo', 'in_progress', 'review', 'done'];
    const distribution: WorkloadDistribution[] = [];

    for (const status of statuses) {
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .eq('status', status);

      distribution.push({ status, count: count || 0 });
    }

    return distribution;
  }
};
