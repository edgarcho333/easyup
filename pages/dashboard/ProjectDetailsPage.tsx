
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { Project, Task } from '../../types';
import { Loader2, ArrowLeft, Settings, Users, Lightbulb, ArrowRight, CheckSquare, Plus, DollarSign, Layout, Calendar, User, Activity, MessageSquare, Target, Briefcase, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { KanbanBoard } from '../../components/tasks/KanbanBoard';
import { TaskCalendar } from '../../components/tasks/TaskCalendar';
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal';
import { TaskDetailModal } from '../../components/tasks/TaskDetailModal';
import { ProjectActivityFeed } from '../../components/projects/ProjectActivityFeed';
import { ProjectChatSidebar } from '../../components/projects/ProjectChatSidebar';
import { ProjectSettingsTab } from '../../components/projects/ProjectSettingsTab';
import { useAuth } from '../../context/AuthContext';

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Active Tab is now derived from URL query param
  const activeTab = searchParams.get('tab') || 'overview';
  
  // Task State
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0);
  const [taskViewMode, setTaskViewMode] = useState<'board' | 'calendar'>('board');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterMyTasks, setFilterMyTasks] = useState(false);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProjectDetails(id);
    }
  }, [id]);

  const fetchProjectDetails = async (projectId: string) => {
    try {
      const data = await projectService.getProject(projectId);
      setProject(data);
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      
      {/* Unified Command Header - Sticky Top */}
      <div className="sticky top-0 z-30 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 mb-6">
        <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 transition-all">
           
           {/* LEFT: Project Context */}
           <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigate('/projects')}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm group shrink-0"
                  title="Back to Projects"
                >
                  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                </button>
                
                <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {project ? (
                    <>
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner ring-2 ring-white">
                          {project.name[0]}
                      </div>
                      <div className="flex flex-col min-w-0 max-w-[180px] sm:max-w-none">
                          <h1 className="text-sm font-bold text-slate-900 truncate leading-tight flex items-center gap-2">
                            {project.name}
                            <span className={`inline-flex w-2 h-2 rounded-full ${project.status === 'active' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-slate-300'}`}></span>
                          </h1>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium leading-tight">
                            <Briefcase className="h-3 w-3" />
                            <span className="truncate">{project.client_name}</span>
                          </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-lg bg-slate-200 animate-pulse shrink-0"></div>
                      <div className="flex flex-col gap-1.5 w-32">
                          <div className="h-4 bg-slate-200 rounded animate-pulse w-full"></div>
                          <div className="h-3 bg-slate-200 rounded animate-pulse w-2/3"></div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile Chat Button (Only visible on small screens) */}
              <button 
                onClick={() => setIsChatOpen(true)} 
                className="lg:hidden p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                 <MessageSquare className="h-5 w-5" />
              </button>
           </div>

           {/* CENTER: Navigation Tabs - Scrollable on Mobile */}
           <div className="w-full lg:w-auto overflow-x-auto no-scrollbar flex justify-start lg:justify-center order-last lg:order-none -mx-4 px-4 lg:mx-0 lg:px-0">
              <div className="flex items-center p-1 bg-slate-100/80 rounded-full border border-slate-200/60 backdrop-blur-sm min-w-max">
                 {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                       <button
                          key={tab.id}
                          onClick={() => handleTabClick(tab.id)}
                          className={`
                             flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap
                             ${isActive 
                                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}
                          `}
                       >
                          <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                          {tab.label}
                       </button>
                    );
                 })}
              </div>
           </div>

           {/* RIGHT: Actions (Desktop) */}
           <div className="items-center justify-end gap-3 w-full lg:w-auto hidden lg:flex">
              <button 
                onClick={() => setIsChatOpen(true)} 
                className="group relative flex items-center gap-2 pl-3 pr-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                 <div className="relative">
                   <MessageSquare className="h-4 w-4 text-indigo-200" />
                   <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-blue-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
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
           <div className="p-8 text-center text-slate-500">Project not found</div>
        ) : (
           <>
            {activeTab === 'overview' && (
               <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <div className="lg:col-span-2 xl:col-span-3 space-y-6">
                    {/* Quick Action Card for Ideas */}
                    <div onClick={() => navigate(`/projects/${id}/ideas`)} className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-primary-900/20 cursor-pointer hover:shadow-xl hover:scale-[1.005] transition-all group relative overflow-hidden border border-white/10">
                       <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors"></div>
                       <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-4 sm:gap-5">
                             <div className="p-3.5 bg-white/20 backdrop-blur-md rounded-xl shadow-inner border border-white/20">
                                <Lightbulb className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                             </div>
                             <div>
                                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Manage Content</h3>
                                <p className="text-primary-100 mt-1 text-sm font-medium opacity-90">Create, review, and approve campaign posts.</p>
                             </div>
                          </div>
                          <div className="bg-white/20 p-2.5 rounded-full backdrop-blur-sm group-hover:bg-white group-hover:text-primary-600 transition-all shadow-sm hidden sm:block">
                             <ArrowRight className="h-5 w-5" />
                          </div>
                       </div>
                    </div>
                    
                    {/* Quick Action Card for Tasks */}
                    <div onClick={() => handleTabClick('tasks')} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm cursor-pointer hover:border-primary-300 hover:shadow-md transition-all group flex items-center justify-between">
                       <div className="flex items-center gap-5">
                          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                             <CheckSquare className="h-7 w-7" />
                          </div>
                          <div>
                             <h3 className="text-xl font-bold text-slate-900">Project Tasks</h3>
                             <p className="text-slate-500 mt-0.5 text-sm">Track progress and manage assignments.</p>
                          </div>
                       </div>
                       <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all hidden sm:block" />
                    </div>

                    <Card className="border-none shadow-none bg-transparent">
                      <CardHeader className="px-0 pt-2"><CardTitle className="text-lg">Description</CardTitle></CardHeader>
                      <CardContent className="px-0">
                        <p className="text-slate-600 leading-relaxed text-base">{project.description || 'No description provided.'}</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-6 lg:col-span-1">
                    <Card className="bg-white/50 backdrop-blur-sm border-slate-200/60">
                       <CardHeader className="pb-4"><CardTitle className="text-base">Project Stats</CardTitle></CardHeader>
                       <CardContent className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3">
                               <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Target className="h-4 w-4" /></div>
                               <span className="text-slate-600 text-sm font-medium">Monthly Target</span>
                            </div>
                            <span className="font-bold text-slate-900 text-lg">{project.monthly_post_target}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3">
                               <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users className="h-4 w-4" /></div>
                               <span className="text-slate-600 text-sm font-medium">Team Size</span>
                            </div>
                            <span className="font-bold text-slate-900 text-lg">{project.members?.length}</span>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3">
                               <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign className="h-4 w-4" /></div>
                               <span className="text-slate-600 text-sm font-medium">Budget Cap</span>
                            </div>
                            <span className="font-bold text-slate-900 text-lg">{project.total_budget ? `$${project.total_budget.toLocaleString()}` : 'Not Set'}</span>
                          </div>
                       </CardContent>
                    </Card>
                  </div>
               </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar">
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
                       <button 
                         onClick={() => setTaskViewMode('board')}
                         className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${taskViewMode === 'board' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                       >
                         <Layout className="h-3.5 w-3.5" /> Board
                       </button>
                       <button 
                         onClick={() => setTaskViewMode('calendar')}
                         className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${taskViewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                       >
                         <Calendar className="h-3.5 w-3.5" /> Calendar
                       </button>
                    </div>
                    
                    <button 
                      onClick={() => setFilterMyTasks(!filterMyTasks)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border flex items-center gap-1.5 transition-colors shrink-0 ${
                        filterMyTasks 
                          ? 'bg-primary-50 border-primary-200 text-primary-700' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <User className="h-3.5 w-3.5" /> My Tasks
                    </button>
                  </div>
                  <Button onClick={() => setIsCreateTaskModalOpen(true)} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Task
                  </Button>
                </div>
                
                {taskViewMode === 'board' ? (
                  <KanbanBoard 
                    projectId={project.id} 
                    refreshTrigger={taskRefreshTrigger}
                    onTaskClick={(task) => setSelectedTask(task)}
                    assigneeIdFilter={filterMyTasks ? user?.id : null}
                  />
                ) : (
                  <TaskCalendar 
                    projectId={project.id} 
                    refreshTrigger={taskRefreshTrigger} 
                    onTaskClick={(task) => setSelectedTask(task)}
                  />
                )}
              </div>
            )}

            {activeTab === 'team' && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {project.members?.map(member => (
                   <div key={member.id} className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow group">
                     <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg group-hover:scale-110 transition-transform border-2 border-white shadow-sm">
                       {member.user?.full_name?.[0] || 'U'}
                     </div>
                     <div>
                       <p className="font-bold text-slate-900">{member.user?.full_name || 'Unknown'}</p>
                       <p className="text-sm text-slate-500 capitalize">{member.role?.display_name}</p>
                       <div className="flex items-center gap-1.5 mt-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${member.user ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                          <span className="text-xs text-slate-400 font-medium">{member.user ? 'Active' : 'Pending'}</span>
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
            onClose={() => setIsCreateTaskModalOpen(false)}
            onSuccess={() => setTaskRefreshTrigger(prev => prev + 1)}
            projectId={project.id}
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
        </>
      )}
    </div>
  );
};