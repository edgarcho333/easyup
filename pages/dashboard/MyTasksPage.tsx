
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { Task, Project, TaskPriority } from '../../types';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Plus, 
  Search, 
  Clock,
  Trash2,
  Briefcase,
  LayoutList,
  CheckSquare,
  User as UserIcon
} from 'lucide-react';
import { TaskDetailModal } from '../../components/tasks/TaskDetailModal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SmartDatePicker } from '../../components/ui/SmartDatePicker';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (e: React.MouseEvent, task: Task) => void;
  onTaskClick: (task: Task) => void;
  onDateChange: (task: Task, date: string | null) => void;
  onDelete: (e: React.MouseEvent, taskId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onToggleComplete, 
  onTaskClick, 
  onDateChange, 
  onDelete 
}) => {
  const isDone = task.status === 'done';
  
  const priorityColors = {
      high: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-900/50',
      medium: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border-orange-100 dark:border-orange-900/50',
      low: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-900/50'
  };

  const renderAssignees = () => {
    if (!task.assignees || task.assignees.length === 0) return null;
    const display = task.assignees.slice(0, 3);
    return (
        <div className="flex -space-x-1.5">
            {display.map(u => (
                <div key={u.id} className="w-5 h-5 rounded-full border border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-300 shadow-sm" title={u.full_name}>
                    {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full rounded-full object-cover" /> : u.full_name?.[0]}
                </div>
            ))}
            {task.assignees.length > 3 && (
                <div className="w-5 h-5 rounded-full border border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-[8px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center">
                    +{task.assignees.length - 3}
                </div>
            )}
        </div>
    );
  };

  return (
    <div 
        onClick={() => onTaskClick(task)}
        className={`group flex items-center gap-4 p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-sm transition-all cursor-pointer mb-2 relative ${isDone ? 'bg-slate-50 dark:bg-slate-900/50 opacity-75' : ''}`}
    >
        {/* Checkbox */}
        <button 
            type="button"
            onClick={(e) => onToggleComplete(e, task)}
            className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0
                ${isDone 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-green-500 hover:text-green-100'}`}
        >
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={3} />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
                <h4 className={`text-sm font-medium truncate transition-all ${isDone ? 'text-slate-500 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600' : 'text-slate-900 dark:text-slate-100'}`}>
                    {task.title}
                </h4>
                {task.project && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 max-w-[120px] truncate">
                        <Briefcase className="h-3 w-3" /> {task.project.name}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <div onClick={(e) => e.stopPropagation()}>
                    <SmartDatePicker 
                        value={task.due_date || null}
                        onChange={(date) => onDateChange(task, date)}
                        placeholder="No Date"
                        className="border-transparent bg-transparent px-0 py-0 hover:bg-slate-50 dark:hover:bg-slate-700 hover:px-2 h-6 text-[11px]"
                    />
                </div>
                
                {!isDone && (
                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide font-bold border ${priorityColors[task.priority]}`}>
                        {task.priority}
                    </span>
                )}

                {renderAssignees()}
            </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
            <button 
                type="button"
                onClick={(e) => onDelete(e, task.id)}
                className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    </div>
  );
};

export const MyTasksPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Quick Add State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('medium');
  const [quickProject, setQuickProject] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, refreshTrigger]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      if (user?.currentOrganization) {
        const [tasksData, projectsData] = await Promise.all([
            taskService.getUserTasks(user.id),
            projectService.getProjects(user.currentOrganization.id, user.id, user.currentRole || 'client')
        ]);
        setTasks(tasksData);
        setProjects(projectsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Actions ---

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const toggleComplete = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    
    // Optimistic Update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
       await taskService.updateTaskStatus(task.id, newStatus);
       addToast(newStatus === 'done' ? 'Task completed' : 'Task reopened', 'success');
       setRefreshTrigger(prev => prev + 1); // Refresh to re-sort
    } catch(err) { 
        console.error(err);
        // Revert
        setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleDateChange = async (task: Task, newDate: string | null) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, due_date: newDate || undefined } : t));
    
    try {
       await taskService.updateTask(task.id, { due_date: newDate || undefined });
       addToast('Due date updated', 'info');
       setRefreshTrigger(prev => prev + 1);
    } catch (err) {
       console.error(err);
       addToast('Failed to update date', 'error');
       setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleDelete = async (e: React.MouseEvent, taskId: string) => {
      e.stopPropagation();
      if(!window.confirm("Are you sure you want to delete this task?")) return;

      try {
          await taskService.deleteTask(taskId);
          setTasks(prev => prev.filter(t => t.id !== taskId));
          addToast('Task deleted', 'info');
      } catch (err) {
          console.error(err);
      }
  }

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !user) return;
    
    setIsAdding(true);
    try {
        const pid = quickProject || (projects.length > 0 ? projects[0].id : '');

        await taskService.createTask({
            title: quickTitle,
            assigned_to: [user.id],
            created_by: user.id,
            status: 'todo',
            priority: quickPriority,
            due_date: new Date().toISOString(), 
            project_id: pid
        });
        
        setQuickTitle('');
        setQuickPriority('medium');
        addToast('Task added to your list', 'success');
        setRefreshTrigger(prev => prev + 1);
    } catch (err) {
        console.error(err);
        addToast('Failed to create task', 'error');
    } finally {
        setIsAdding(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = 
        activeTab === 'completed' ? t.status === 'done' :
        activeTab === 'all' ? t.status !== 'done' :
        t.status !== 'done'; 
      
      return matchesSearch && matchesTab;
  });

  const getGroupedTasks = () => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const groups = {
        overdue: [] as Task[],
        today: [] as Task[],
        upcoming: [] as Task[],
        noDate: [] as Task[],
        completed: [] as Task[]
    };

    filteredTasks.forEach(task => {
        if (task.status === 'done') {
            groups.completed.push(task);
            return;
        }

        if (!task.due_date) {
            groups.noDate.push(task);
            return;
        }

        const due = new Date(task.due_date);
        due.setHours(0,0,0,0);

        if (due.getTime() < today.getTime()) {
            groups.overdue.push(task);
        } else if (due.getTime() === today.getTime()) {
            groups.today.push(task);
        } else {
            groups.upcoming.push(task);
        }
    });

    if (activeTab === 'today') return { ...groups, upcoming: [], noDate: [] };
    if (activeTab === 'upcoming') return { ...groups, overdue: [], today: [] };
    if (activeTab === 'completed') return { overdue: [], today: [], upcoming: [], noDate: [], completed: groups.completed };

    return groups;
  };

  const { overdue, today, upcoming, noDate, completed } = getGroupedTasks();
  const pendingCount = overdue.length + today.length + upcoming.length + noDate.length;
  const progressPercent = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0;

  // Tab counts - calculate based on all tasks, not filtered
  const getTabCounts = () => {
    const todayDate = new Date();
    todayDate.setHours(0,0,0,0);

    let allCount = 0;
    let todayCount = 0;
    let upcomingCount = 0;
    let completedCount = 0;

    tasks.forEach(task => {
      if (task.status === 'done') {
        completedCount++;
        return;
      }

      allCount++;

      if (task.due_date) {
        const due = new Date(task.due_date);
        due.setHours(0,0,0,0);

        if (due.getTime() <= todayDate.getTime()) {
          todayCount++;
        } else {
          upcomingCount++;
        }
      }
    });

    return { all: allCount, today: todayCount, upcoming: upcomingCount, completed: completedCount };
  };

  const tabCounts = getTabCounts();

  if (isLoading && tasks.length === 0) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Tasks</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                You have <strong className="text-primary-600 dark:text-primary-400">{pendingCount} tasks</strong> remaining.
            </p>
            {/* Simple Progress Bar */}
            <div className="mt-3 w-full md:w-64 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
        </div>
        
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
            {(['all', 'today', 'upcoming', 'completed'] as const).map(tab => (
                <button
                    type="button"
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize flex items-center gap-2
                        ${activeTab === tab
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                >
                    {tab}
                    <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center
                        ${activeTab === tab
                            ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                        {tabCounts[tab]}
                    </span>
                </button>
            ))}
        </div>
      </div>

      {/* Quick Add & Search */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-900 dark:to-primary-800 p-6 rounded-2xl shadow-lg text-white">
         <form onSubmit={handleQuickAdd} className="space-y-4">
            <div className="flex items-center gap-2 text-primary-100 text-sm font-medium mb-1">
                <Plus className="h-4 w-4" /> Quick Add Task
            </div>
            <div className="flex gap-3">
                <input 
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-primary-200 focus:outline-none focus:bg-white/20 focus:border-white/30 transition-all font-medium"
                    placeholder="What needs to be done?"
                    value={quickTitle}
                    onChange={e => setQuickTitle(e.target.value)}
                />
                <Button type="submit" isLoading={isAdding} className="bg-white text-primary-700 hover:bg-primary-50 border-transparent shadow-sm">
                    Add Task
                </Button>
            </div>
            <div className="flex gap-4">
                 <div className="flex gap-2">
                    {['low', 'medium', 'high'].map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setQuickPriority(p as TaskPriority)}
                            className={`px-3 py-1 rounded-full text-xs font-medium capitalize border transition-all ${quickPriority === p ? 'bg-white text-primary-700 border-white' : 'bg-transparent text-primary-100 border-primary-500/30 hover:bg-white/10'}`}
                        >
                            {p}
                        </button>
                    ))}
                 </div>
                 
                 {projects.length > 0 && (
                    <div className="relative">
                         <select 
                            className="appearance-none bg-transparent text-primary-100 text-xs font-medium border-none outline-none cursor-pointer pr-4"
                            value={quickProject}
                            onChange={e => setQuickProject(e.target.value)}
                         >
                            <option value="" className="text-slate-900 dark:text-white dark:bg-slate-800">No Project</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id} className="text-slate-900 dark:text-white dark:bg-slate-800">{p.name}</option>
                            ))}
                         </select>
                    </div>
                 )}
            </div>
         </form>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
          {/* Filters Bar */}
          <div className="flex gap-4 sticky top-4 z-10 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm py-2 -my-2">
             <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                 <Input 
                    className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm focus:ring-primary-200 h-10 text-slate-900 dark:text-white"
                    placeholder="Filter tasks..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                 />
             </div>
          </div>
          
          {/* Overdue Section */}
          {overdue.length > 0 && activeTab !== 'completed' && (
              <section>
                  <h3 className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3 px-1">
                      <AlertCircle className="h-4 w-4" /> Overdue ({overdue.length})
                  </h3>
                  <div>{overdue.map(t => <TaskItem key={t.id} task={t} onToggleComplete={toggleComplete} onTaskClick={handleTaskClick} onDateChange={handleDateChange} onDelete={handleDelete} />)}</div>
              </section>
          )}

          {/* Today Section */}
          {today.length > 0 && activeTab !== 'completed' && (
              <section>
                  <h3 className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 px-1">
                      <Clock className="h-4 w-4 text-primary-600 dark:text-primary-400" /> Due Today ({today.length})
                  </h3>
                  <div>{today.map(t => <TaskItem key={t.id} task={t} onToggleComplete={toggleComplete} onTaskClick={handleTaskClick} onDateChange={handleDateChange} onDelete={handleDelete} />)}</div>
              </section>
          )}

          {/* Upcoming Section */}
          {upcoming.length > 0 && (activeTab === 'all' || activeTab === 'upcoming') && (
               <section>
                  <h3 className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">
                      <Calendar className="h-4 w-4" /> Upcoming
                  </h3>
                  <div>{upcoming.map(t => <TaskItem key={t.id} task={t} onToggleComplete={toggleComplete} onTaskClick={handleTaskClick} onDateChange={handleDateChange} onDelete={handleDelete} />)}</div>
               </section>
          )}

          {/* No Date Section */}
          {noDate.length > 0 && (activeTab === 'all' || activeTab === 'upcoming') && (
               <section>
                  <h3 className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">
                      <LayoutList className="h-4 w-4" /> No Due Date
                  </h3>
                  <div>{noDate.map(t => <TaskItem key={t.id} task={t} onToggleComplete={toggleComplete} onTaskClick={handleTaskClick} onDateChange={handleDateChange} onDelete={handleDelete} />)}</div>
               </section>
          )}

          {/* Completed Section */}
          {completed.length > 0 && (activeTab === 'all' || activeTab === 'completed') && (
               <section className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 mt-8">
                  <div className="flex items-center gap-4 mb-4">
                     <h3 className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                        <CheckSquare className="h-4 w-4" /> Completed
                     </h3>
                  </div>
                  <div>{completed.map(t => <TaskItem key={t.id} task={t} onToggleComplete={toggleComplete} onTaskClick={handleTaskClick} onDateChange={handleDateChange} onDelete={handleDelete} />)}</div>
               </section>
          )}

          {/* Empty State */}
          {filteredTasks.length === 0 && (
              <div className="text-center py-24">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                      <CheckCircle2 className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">All caught up!</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">
                      {activeTab === 'completed' 
                        ? "No completed tasks found."
                        : "You have no pending tasks. Enjoy your day!"}
                  </p>
              </div>
          )}
      </div>

      <TaskDetailModal 
         task={selectedTask}
         isOpen={!!selectedTask}
         onClose={() => setSelectedTask(null)}
         onUpdate={() => setRefreshTrigger(prev => prev + 1)}
         projectId={selectedTask?.project_id || ''}
       />
    </div>
  );
};
