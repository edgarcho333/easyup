
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { ideaService } from '../../services/ideaService';
import { budgetService } from '../../services/budgetService';
import { Project, Task, Idea, ProjectBudget } from '../../types';
import { 
  Loader2, ArrowLeft, Settings, Users, Lightbulb, ArrowRight, 
  CheckSquare, Plus, DollarSign, Layout, Calendar, User, 
  Activity, MessageSquare, Target, Briefcase, Zap, 
  GanttChart, BarChart2, LineChart, Bell, PieChart,
  TrendingUp, AlertCircle, CheckCircle2, Clock, Layers, FileText, AlertTriangle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { KanbanBoard } from '../../components/tasks/KanbanBoard';
import { TaskCalendar } from '../../components/tasks/TaskCalendar';
import { TaskTimeline } from '../../components/tasks/TaskTimeline';
import { TaskWorkload } from '../../components/tasks/TaskWorkload';
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal';
import { TaskDetailModal } from '../../components/tasks/TaskDetailModal';
import { ProjectActivityFeed } from '../../components/projects/ProjectActivityFeed';
import { ProjectChatSidebar } from '../../components/projects/ProjectChatSidebar';
import { ProjectSettingsTab } from '../../components/projects/ProjectSettingsTab';
import { ProjectDashboard } from '../../components/projects/ProjectDashboard';
import { WorkflowList } from '../../components/workflows/WorkflowList'; 
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationDropdown } from '../../components/notifications/NotificationDropdown';

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [budget, setBudget] = useState<ProjectBudget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Active Tab is now derived from URL query param
  const activeTab = searchParams.get('tab') || 'overview';
  
  // Task State
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0);
  const [taskViewMode, setTaskViewMode] = useState<'board' | 'calendar' | 'timeline' | 'dashboard' | 'workload'>('board');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterMyTasks, setFilterMyTasks] = useState(false);
  const [initialTaskDate, setInitialTaskDate] = useState<string | undefined>(undefined);

  // Workflow State
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Notification State
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProjectDetails(id);
    }
  }, [id, taskRefreshTrigger]);

  const fetchProjectDetails = async (projectId: string) => {
    try {
      const [pData, tData, iData, bData] = await Promise.all([
        projectService.getProject(projectId),
        taskService.getProjectTasks(projectId),
        ideaService.getProjectIdeas(projectId),
        budgetService.getProjectBudget(projectId)
      ]);
      setProject(pData);
      setTasks(tData);
      setIdeas(iData);
      setBudget(bData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layout },
    { id: 'content', label: 'Content', icon: Lightbulb },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'budget', label: 'Budget', icon: DollarSign },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === 'content') {
      navigate(`/projects/${id}/ideas`);
    } else if (tabId === 'budget') {
      navigate(`/projects/${id}/budget`);
    } else {
      setSearchParams({ tab: tabId });
    }
  };

  const handleAddTask = (date?: string) => {
    setInitialTaskDate(date);
    setIsCreateTaskModalOpen(true);
  };

  const handleCloseCreateTask = () => {
    setIsCreateTaskModalOpen(false);
    setInitialTaskDate(undefined);
  };

  // --- Overview Calculations ---
  const overviewStats = useMemo(() => {
    // Tasks
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date());
    
    // Ideas Funnel
    const drafts = ideas.filter(i => i.status === 'draft').length;
    const inProduction = ideas.filter(i => i.status === 'in_production' || i.status === 'pending_approval').length;
    const ready = ideas.filter(i => i.status === 'scheduled' || i.status === 'published' || i.status === 'pending_final_review').length;

    // Budget
    const totalBudget = budget?.total_budget || 0;
    const spent = budget?.budget_spent || 0;
    const remaining = totalBudget - spent;
    const budgetHealth = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;

    return {
        progress,
        inProgressCount: inProgressTasks,
        overdueCount: overdueTasks.length,
        urgentTasks: overdueTasks.slice(0, 4), // Show up to 4
        contentFunnel: { drafts, inProduction, ready },
        budget: { total: totalBudget, remaining, health: budgetHealth, spent }
    };
  }, [tasks, ideas, budget]);

  // Filter notifications for this project
  const projectUnreadCount = notifications.filter(n => n.project_id === id && !n.is_read).length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950/50 transition-colors">
      
      {/* Unified Command Header - Sticky Top */}
      <div className="sticky top-0 z-30 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 mb-6">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 transition-all">
           
           {/* LEFT: Project Context */}
           <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigate('/projects')}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm group shrink-0"
                  title="Back to Projects"
                >
                  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                </button>
                
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
                
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {project ? (
                    <>
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner ring-2 ring-white dark:ring-slate-800">
                          {project.name[0]}
                      </div>
                      <div className="flex flex-col min-w-0 max-w-[180px] sm:max-w-none">
                          <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight flex items-center gap-2">
                            {project.name}
                            <span className={`inline-flex w-2 h-2 rounded-full ${project.status === 'active' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                          </h1>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                            <Briefcase className="h-3 w-3" />
                            <span className="truncate">{project.client_name}</span>
                          </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0"></div>
                      <div className="flex flex-col gap-1.5 w-32">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-full"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-2/3"></div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile Chat Button */}
              <button 
                onClick={() => setIsChatOpen(true)} 
                className="lg:hidden p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                 <MessageSquare className="h-5 w-5" />
              </button>
           </div>

           {/* CENTER: Navigation Tabs */}
           <div className="w-full lg:w-auto overflow-x-auto no-scrollbar flex justify-start lg:justify-center order-last lg:order-none -mx-4 px-4 lg:mx-0 lg:px-0">
              <div className="flex items-center p-1 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-slate-200/60 dark:border-slate-700/60 min-w-max shadow-sm">
                 {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                       <button
                          key={tab.id}
                          onClick={() => handleTabClick(tab.id)}
                          className={`
                             flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap
                             ${isActive 
                                ? 'bg-primary-600 text-white shadow-md ring-2 ring-primary-100 dark:ring-primary-900' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/60'}
                          `}
                       >
                          <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                          {tab.label}
                       </button>
                    );
                 })}
              </div>
           </div>

           {/* RIGHT: Actions (Desktop) */}
           <div className="items-center justify-end gap-3 w-full lg:w-auto hidden lg:flex">
              <div className="relative">
                  <button 
                      onClick={() => setIsNotifOpen(!isNotifOpen)}
                      className="h-9 w-9 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                  >
                      <Bell className="h-4 w-4" />
                      {projectUnreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                      )}
                  </button>
                  <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} projectId={id} />
              </div>

              <button 
                onClick={() => setIsChatOpen(true)} 
                className="group relative flex items-center gap-2 pl-3 pr-4 py-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                 <div className="relative">
                   <MessageSquare className="h-4 w-4 text-indigo-200 dark:text-indigo-600" />
                   <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-blue-500 rounded-full border-2 border-slate-900 dark:border-slate-100 animate-pulse"></span>
                 </div>
                 <span className="font-medium text-xs">Project Chat</span>
              </button>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {isLoading ? (
           <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
        ) : !project ? (
           <div className="p-8 text-center text-slate-500 dark:text-slate-400">Project not found</div>
        ) : (
           <>
            {activeTab === 'overview' && (
               <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  
                  {/* LEFT COLUMN: Main Dashboard & Actions */}
                  <div className="xl:col-span-2 space-y-8">
                     
                     {/* 1. Project Pulse Row (KPIs) */}
                     <div className="grid grid-cols-3 gap-4">
                        {/* Progress */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                           <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
                           <div className="relative z-10">
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Progress</p>
                              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{overviewStats.progress}%</h3>
                              <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                                 <div className="h-full bg-blue-500" style={{width: `${overviewStats.progress}%`}}></div>
                              </div>
                           </div>
                        </div>

                        {/* Content Velocity */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                           <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 dark:bg-purple-900/20 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
                           <div className="relative z-10">
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Content Flow</p>
                              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{overviewStats.contentFunnel.inProduction} <span className="text-sm text-slate-400 font-medium">Active</span></h3>
                              <p className="text-xs text-slate-400 mt-1">{overviewStats.contentFunnel.ready} Ready to publish</p>
                           </div>
                        </div>

                        {/* Team Active */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                           <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
                           <div className="relative z-10">
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Team</p>
                              <div className="flex -space-x-2 mt-1">
                                 {project.members?.slice(0, 4).map(m => (
                                    <div key={m.id} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                       {m.user?.full_name?.[0]}
                                    </div>
                                 ))}
                                 {project.members && project.members.length > 4 && (
                                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">+{project.members.length - 4}</div>
                                 )}
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* 2. Primary Actions Area */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Manage Content - Hero Card */}
                        <div 
                           onClick={() => navigate(`/projects/${id}/ideas`)}
                           className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-8 text-white shadow-lg shadow-indigo-200 dark:shadow-none cursor-pointer group hover:scale-[1.01] transition-all"
                        >
                           <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors"></div>
                           
                           <div className="relative z-10 flex flex-col h-full justify-between min-h-[180px]">
                              <div className="flex justify-between items-start">
                                 <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/20">
                                    <Lightbulb className="h-6 w-6 text-white" />
                                 </div>
                                 <div className="bg-white/20 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="h-4 w-4 text-white" />
                                 </div>
                              </div>
                              
                              <div>
                                 <h3 className="text-2xl font-bold mb-1">Manage Content</h3>
                                 <p className="text-indigo-100 text-sm opacity-90 mb-4">Ideation, approvals & scheduling.</p>
                                 
                                 <div className="flex gap-2">
                                    <div className="flex flex-col bg-black/20 rounded-lg px-3 py-2 backdrop-blur-sm border border-white/5">
                                       <span className="text-xs font-medium opacity-70">Drafts</span>
                                       <span className="text-lg font-bold">{overviewStats.contentFunnel.drafts}</span>
                                    </div>
                                    <div className="flex flex-col bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm border border-white/20">
                                       <span className="text-xs font-bold opacity-80">Review</span>
                                       <span className="text-lg font-bold">{overviewStats.contentFunnel.inProduction}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Project Tasks - Hero Card */}
                        <div 
                           onClick={() => handleTabClick('tasks')}
                           className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer group hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
                        >
                           <div className="relative z-10 flex flex-col h-full justify-between min-h-[180px]">
                              <div className="flex justify-between items-start">
                                 <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                                    <CheckSquare className="h-6 w-6" />
                                 </div>
                                 <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                 </div>
                              </div>
                              
                              <div>
                                 <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Tasks</h3>
                                 <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Track production & deadlines.</p>
                                 
                                 <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                       <span className="text-slate-600 dark:text-slate-400">Active Tasks</span>
                                       <span className="font-bold text-slate-900 dark:text-white">{overviewStats.inProgressCount}</span>
                                    </div>
                                    {overviewStats.overdueCount > 0 ? (
                                       <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg border border-red-100 dark:border-red-900/50 text-sm">
                                          <AlertCircle className="h-4 w-4" />
                                          <span className="font-bold">{overviewStats.overdueCount} Overdue</span>
                                       </div>
                                    ) : (
                                       <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg border border-green-100 dark:border-green-900/50 text-sm">
                                          <CheckCircle2 className="h-4 w-4" />
                                          <span className="font-bold">On Track</span>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* 3. Large Chart Area (Dashboard) */}
                     <ProjectDashboard projectId={project.id} />
                  </div>

                  {/* RIGHT COLUMN: Sidebar Information */}
                  <div className="space-y-6 flex flex-col h-full">
                     
                     {/* Urgent Attention */}
                     <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden shrink-0">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-red-50/30 dark:bg-red-900/20 flex justify-between items-center">
                           <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500" /> Attention Needed
                           </h4>
                           {overviewStats.overdueCount > 0 && <span className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full">{overviewStats.overdueCount}</span>}
                        </div>
                        <div className="p-2">
                           {overviewStats.urgentTasks.length === 0 ? (
                              <div className="text-center py-8">
                                 <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <CheckCircle2 className="h-5 w-5" />
                                 </div>
                                 <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">All caught up!</p>
                                 <p className="text-xs text-slate-400">No urgent tasks remaining.</p>
                              </div>
                           ) : (
                              <div className="space-y-1">
                                 {overviewStats.urgentTasks.map(task => (
                                    <div 
                                       key={task.id} 
                                       onClick={() => setSelectedTask(task)}
                                       className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                    >
                                       <div className="flex justify-between items-start mb-1">
                                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-1">{task.title}</span>
                                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/50 whitespace-nowrap">
                                             {task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'Overdue'}
                                          </span>
                                       </div>
                                       <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                          <User className="h-3 w-3" />
                                          <span>{task.assignee?.full_name || 'Unassigned'}</span>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                           <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => handleTabClick('tasks')}>View All Tasks</Button>
                        </div>
                     </div>

                     {/* Budget Summary */}
                     <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden shrink-0">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                           <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-emerald-500" /> Budget
                           </h4>
                           <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Monthly Cap</span>
                        </div>
                        <div className="p-5">
                           <div className="flex justify-between items-end mb-2">
                              <div>
                                 <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Remaining</p>
                                 <p className="text-2xl font-bold text-slate-900 dark:text-white">${overviewStats.budget.remaining.toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-xs text-slate-500 dark:text-slate-400">of ${overviewStats.budget.total.toLocaleString()}</p>
                              </div>
                           </div>
                           
                           <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                              <div className={`h-full rounded-full ${overviewStats.budget.health > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width: `${Math.min(overviewStats.budget.health, 100)}%`}}></div>
                           </div>
                           
                           <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span>{overviewStats.budget.health.toFixed(0)}% Used</span>
                              <span>${overviewStats.budget.spent.toLocaleString()} Spent</span>
                           </div>
                        </div>
                        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                           <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => handleTabClick('budget')}>Detailed Breakdown</Button>
                        </div>
                     </div>

                     {/* Recent Activity Expanded */}
                     <div className="flex-1 min-h-[500px]">
                        <ProjectActivityFeed projectId={project.id} className="h-full border-0 shadow-sm bg-white dark:bg-slate-900" />
                     </div>

                  </div>
               </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                       <button 
                         onClick={() => setTaskViewMode('board')}
                         className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${taskViewMode === 'board' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                       >
                         <Layout className="h-3.5 w-3.5" /> Board
                       </button>
                       <button 
                         onClick={() => setTaskViewMode('calendar')}
                         className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${taskViewMode === 'calendar' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                       >
                         <Calendar className="h-3.5 w-3.5" /> Calendar
                       </button>
                       <button 
                         onClick={() => setTaskViewMode('timeline')}
                         className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${taskViewMode === 'timeline' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                       >
                         <GanttChart className="h-3.5 w-3.5" /> Timeline
                       </button>
                       <button 
                         onClick={() => setTaskViewMode('workload')}
                         className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${taskViewMode === 'workload' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                       >
                         <LineChart className="h-3.5 w-3.5" /> Workload
                       </button>
                       <button 
                         onClick={() => setTaskViewMode('dashboard')}
                         className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${taskViewMode === 'dashboard' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                       >
                         <BarChart2 className="h-3.5 w-3.5" /> Analytics
                       </button>
                    </div>
                    
                    <button 
                      onClick={() => setFilterMyTasks(!filterMyTasks)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border flex items-center gap-1.5 transition-colors shrink-0 ${
                        filterMyTasks 
                          ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <User className="h-3.5 w-3.5" /> My Tasks
                    </button>

                    <button 
                      onClick={() => setIsWorkflowOpen(true)}
                      className="px-3 py-1.5 text-xs font-medium rounded-full border flex items-center gap-1.5 transition-colors shrink-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-600 dark:hover:text-amber-400 group"
                    >
                      <Zap className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-500 fill-current" /> Workflows
                    </button>
                  </div>
                  
                  {/* Only show Add Task if not in Dashboard view or Workload view */}
                  {taskViewMode !== 'dashboard' && taskViewMode !== 'workload' && (
                    <Button onClick={() => handleAddTask()} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" /> Add Task
                    </Button>
                  )}
                </div>
                
                {taskViewMode === 'board' && (
                  <KanbanBoard 
                    projectId={project.id} 
                    refreshTrigger={taskRefreshTrigger}
                    onTaskClick={(task) => setSelectedTask(task)}
                    assigneeIdFilter={filterMyTasks ? user?.id : null}
                  />
                )}
                
                {taskViewMode === 'calendar' && (
                  <TaskCalendar 
                    projectId={project.id} 
                    refreshTrigger={taskRefreshTrigger} 
                    onTaskClick={(task) => setSelectedTask(task)}
                    onAddClick={(date) => handleAddTask(date)}
                  />
                )}

                {taskViewMode === 'timeline' && (
                  <TaskTimeline 
                    projectId={project.id}
                    refreshTrigger={taskRefreshTrigger}
                    onTaskClick={(task) => setSelectedTask(task)}
                  />
                )}

                {taskViewMode === 'workload' && (
                  <TaskWorkload 
                    projectId={project.id}
                    refreshTrigger={taskRefreshTrigger}
                    onTaskClick={(task) => setSelectedTask(task)}
                  />
                )}

                {taskViewMode === 'dashboard' && (
                   <ProjectDashboard projectId={project.id} project={project} />
                )}
              </div>
            )}

            {activeTab === 'team' && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {project.members?.map(member => (
                   <div key={member.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow group">
                     <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/50 dark:to-primary-800/50 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-lg group-hover:scale-110 transition-transform border-2 border-white dark:border-slate-800 shadow-sm">
                       {member.user?.full_name?.[0] || 'U'}
                     </div>
                     <div>
                       <p className="font-bold text-slate-900 dark:text-white">{member.user?.full_name || 'Unknown'}</p>
                       <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{member.role?.display_name}</p>
                       <div className="flex items-center gap-1.5 mt-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${member.user ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{member.user ? 'Active' : 'Pending'}</span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            )}

            {activeTab === 'activity' && (
              <div className="max-w-4xl">
                 <ProjectActivityFeed projectId={project.id} />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-5xl">
                 <ProjectSettingsTab 
                    project={project} 
                    onUpdate={() => fetchProjectDetails(project.id)}
                 />
              </div>
            )}
           </>
        )}
      </div>

      {project && (
        <>
          <CreateTaskModal 
            isOpen={isCreateTaskModalOpen}
            onClose={handleCloseCreateTask}
            onSuccess={() => setTaskRefreshTrigger(prev => prev + 1)}
            projectId={project.id}
            initialDate={initialTaskDate}
          />

          <TaskDetailModal 
            task={selectedTask}
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
            onUpdate={() => setTaskRefreshTrigger(prev => prev + 1)}
            projectId={project.id}
          />

          <ProjectChatSidebar 
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            projectId={project.id}
          />

          <WorkflowList 
            isOpen={isWorkflowOpen} 
            onClose={() => setIsWorkflowOpen(false)}
            projectId={project.id}
          />
        </>
      )}
    </div>
  );
};
