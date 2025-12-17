
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { organizationService } from '../../services/organizationService';
import { analyticsService } from '../../services/analyticsService';
import { taskService } from '../../services/taskService';
import { Invitation, AnalyticsSummary, ActivityLog, Task } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TrendingUp, Users, Calendar, BarChart3, Mail, Check, Loader2, CheckSquare, Lightbulb, FolderOpen, ClipboardList } from 'lucide-react';

export const DashboardHome: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.currentOrganization?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [statsData, activitiesData, tasksData, invites] = await Promise.all([
          analyticsService.getOrganizationStats(user.currentOrganization.id),
          analyticsService.getActivityLogs(user.currentOrganization.id, 5),
          taskService.getUserTasks(user.id),
          user.email ? organizationService.getUserInvitations(user.email) : Promise.resolve([])
        ]);

        setStats(statsData);
        setActivities(activitiesData);
        // Filter upcoming tasks (not done, with due date)
        const upcoming = tasksData
          .filter(t => t.status !== 'done' && t.due_date)
          .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
          .slice(0, 5);
        setUpcomingTasks(upcoming);
        setPendingInvites(invites);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleAcceptInvite = async (invitationId: string) => {
    if (!user) return;
    setIsAccepting(invitationId);
    try {
      await organizationService.acceptInvitation(invitationId, user.id);
      // Remove from list immediately (optimistic update)
      setPendingInvites(prev => prev.filter(i => i.id !== invitationId));
      addToast('Invitation accepted successfully!', 'success');
      // Refresh profile to update organization list
      await refreshProfile();
      // Small delay to ensure Supabase update is propagated before reload
      await new Promise(resolve => setTimeout(resolve, 500));
      // Reload to ensure all context is updated
      window.location.reload();
    } catch (err) {
      console.error("Failed to accept invitation", err);
      addToast('Failed to accept invitation. Please try again.', 'error');
      // Refresh the list in case of error to show actual state
      if (user?.email) {
        const invites = await organizationService.getUserInvitations(user.email);
        setPendingInvites(invites);
      }
    } finally {
      setIsAccepting(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const statsCards = [
    {
      title: "Active Projects",
      value: stats?.active_projects ?? '-',
      icon: FolderOpen,
      subtitle: `${stats?.total_projects ?? 0} total`,
      color: "text-green-600 dark:text-green-400"
    },
    {
      title: "Content Ideas",
      value: stats?.total_ideas ?? '-',
      icon: Lightbulb,
      subtitle: `${stats?.approval_rate ?? 0}% approved`,
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Approved Ideas",
      value: stats?.approved_ideas ?? '-',
      icon: CheckSquare,
      subtitle: "ready to publish",
      color: "text-orange-600 dark:text-orange-400"
    },
    {
      title: "Tasks Completed",
      value: stats?.tasks_completed ?? '-',
      icon: ClipboardList,
      subtitle: `${upcomingTasks.length} upcoming`,
      color: "text-purple-600 dark:text-purple-400"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Overview for <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.currentOrganization?.name || 'Your Account'}</span>
          </p>
        </div>
        {user?.currentOrganization && (
          <div className="flex gap-2">
             <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
               {user?.currentRole?.replace('_', ' ')} View
             </span>
          </div>
        )}
      </div>

      {/* Pending Invitations Alert */}
      {pendingInvites.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            Pending Invitations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-primary-100 dark:border-primary-900 shadow-sm flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary-500"></div>
                <div>
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold uppercase tracking-wider">Invitation</p>
                  <h4 className="font-bold text-slate-900 dark:text-white text-lg">{invite.organization?.name}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Role: <span className="font-medium text-slate-700 dark:text-slate-300">{invite.role?.display_name}</span></p>
                  {invite.inviter && (
                    <p className="text-xs text-slate-400 mt-1">Invited by {invite.inviter.full_name}</p>
                  )}
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleAcceptInvite(invite.id)}
                  className="w-full mt-auto bg-green-600 hover:bg-green-700 text-white border-transparent"
                  isLoading={isAccepting === invite.id}
                >
                  <Check className="ml-2 h-3 w-3" /> Accept Invitation
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="dark:bg-slate-800 dark:border-slate-700 animate-pulse">
              <CardContent className="p-6 pt-6">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-4"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-2"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-6 pt-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div className="flex flex-col mt-2">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {stat.subtitle}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <Card className="lg:col-span-2 xl:col-span-3 dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                    </div>
                  </div>
                ))
              ) : activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300 text-xs font-bold">
                      {activity.user?.avatar_url ? (
                        <img src={activity.user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        getInitials(activity.user?.full_name)
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                        <span className="font-semibold">{activity.user?.full_name || 'Someone'}</span>{' '}
                        {activity.action_type.replace(/_/g, ' ')} {activity.entity_type}
                        {activity.details?.name && ` "${activity.details.name}"`}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatTimeAgo(activity.created_at)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              onClick={() => navigate('/projects')}
              className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              + New Project
            </button>
            <button
              onClick={() => navigate('/team')}
              className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              + Invite Team Member
            </button>
            <button
              onClick={() => navigate('/my-tasks')}
              className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              View My Tasks
            </button>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        {upcomingTasks.length > 0 && (
          <Card className="lg:col-span-2 xl:col-span-3 dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                Upcoming Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/projects/${task.project_id}?tab=tasks`)}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{task.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {task.project?.name || 'Unknown project'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${
                        new Date(task.due_date!) < new Date()
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {new Date(task.due_date!).toLocaleDateString('ka-GE', { day: 'numeric', month: 'short' })}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        task.status === 'todo' ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
