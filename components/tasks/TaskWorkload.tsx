
import React, { useState, useEffect, useMemo } from 'react';
import { Task, ProjectMember } from '../../types';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { Loader2, User, ChevronLeft, ChevronRight, Clock, Calculator, Plus, ChevronDown, ChevronUp } from 'lucide-react';

interface TaskWorkloadProps {
  projectId: string;
  refreshTrigger: number;
  onTaskClick: (task: Task) => void;
}

type EffortType = 'count' | 'hours' | 'points';

export const TaskWorkload: React.FC<TaskWorkloadProps> = ({ projectId, refreshTrigger, onTaskClick }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [effortType, setEffortType] = useState<EffortType>('hours');
  const [expandedUsers, setExpandedUsers] = useState<string[]>([]);

  // Configuration
  const CAPACITY_HOURS = 8;
  const CAPACITY_COUNT = 5;
  const CAPACITY_POINTS = 20;
  const DAYS_TO_SHOW = 14;

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [tData, pData] = await Promise.all([
          taskService.getProjectTasks(projectId),
          projectService.getProject(projectId)
        ]);
        setTasks(tData);
        if (pData.members) setMembers(pData.members);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [projectId, refreshTrigger]);

  // --- Date Logic ---
  const dateRange = useMemo(() => {
    const dates = [];
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Start on Monday
    
    for (let i = 0; i < DAYS_TO_SHOW; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [currentDate]);

  const navigate = (dir: 'prev' | 'next') => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (dir === 'next' ? 7 : -7));
    setCurrentDate(d);
  };

  // --- Workload Calculation ---
  const getDailyEffort = (userId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const userTasks = tasks.filter(t => {
        // Check if user is one of the assignees
        if (!t.assigned_to || !t.assigned_to.includes(userId)) return false;
        
        if (t.status === 'done') return false; // Exclude completed for workload planning
        
        // Check if date falls within task range
        const start = t.start_date ? new Date(t.start_date) : (t.due_date ? new Date(t.due_date) : new Date(t.created_at));
        const end = t.due_date ? new Date(t.due_date) : start;
        
        // Normalize
        const target = new Date(dateStr);
        start.setHours(0,0,0,0);
        end.setHours(0,0,0,0);
        
        return target >= start && target <= end;
    });

    if (effortType === 'count') return userTasks.length;
    
    return userTasks.reduce((sum, t) => {
       // If task has no effort set, assume default based on type
       const val = t.effort || (effortType === 'hours' ? 1 : 1); 
       
       // Divide effort across assignees? Usually tasks duplicate effort if multiple people work on it.
       // Let's assume effort is total effort, but here we just count it fully for each user to be safe (worst case planning).
       
       // Distribute effort across days
       const start = t.start_date ? new Date(t.start_date) : (t.due_date ? new Date(t.due_date) : new Date(t.created_at));
       const end = t.due_date ? new Date(t.due_date) : start;
       const duration = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1);
       
       return sum + (val / duration);
    }, 0);
  };

  const getCapacity = () => {
    switch(effortType) {
      case 'hours': return CAPACITY_HOURS;
      case 'count': return CAPACITY_COUNT;
      case 'points': return CAPACITY_POINTS;
    }
  };

  const toggleUser = (userId: string) => {
    setExpandedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;

  const maxCap = getCapacity();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden h-[calc(100vh-280px)] min-h-[600px]">
      
      {/* Header Controls */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
         <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
               <button onClick={() => setEffortType('count')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${effortType === 'count' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>Tasks</button>
               <button onClick={() => setEffortType('hours')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${effortType === 'hours' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>Hours</button>
               <button onClick={() => setEffortType('points')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${effortType === 'points' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>Points</button>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
               <div className="w-3 h-3 bg-red-500 rounded-full" />
               <span>Over Capacity ({'>'} {maxCap} {effortType})</span>
            </div>
         </div>

         <div className="flex items-center gap-2">
            <button onClick={() => navigate('prev')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"><ChevronLeft className="h-5 w-5 text-slate-500 dark:text-slate-400" /></button>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 min-w-[140px] text-center">
               {dateRange[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {dateRange[dateRange.length-1].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            <button onClick={() => navigate('next')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"><ChevronRight className="h-5 w-5 text-slate-500 dark:text-slate-400" /></button>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
         {/* Sidebar: Users */}
         <div className="w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="h-12 border-b border-slate-100 dark:border-slate-800 px-4 flex items-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
               Team Member
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
               {members.map(m => (
                  <div key={m.id}>
                    <div 
                      className="h-14 flex items-center px-4 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group transition-colors"
                      onClick={() => toggleUser(m.user_id)}
                    >
                       <div className="mr-2 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                          {expandedUsers.includes(m.user_id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                       </div>
                       <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 mr-3 border border-slate-300 dark:border-slate-600">
                          {m.user?.avatar_url ? <img src={m.user.avatar_url} className="h-full w-full rounded-full object-cover" /> : m.user?.full_name?.[0]}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{m.user?.full_name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{m.role?.display_name}</p>
                       </div>
                    </div>
                    {/* Spacer for expanded tasks rows */}
                    {expandedUsers.includes(m.user_id) && (
                       <div className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                          {tasks.filter(t => t.assigned_to?.includes(m.user_id) && t.status !== 'done').map(t => (
                             <div key={t.id} className="h-8 px-10 flex items-center text-xs text-slate-500 dark:text-slate-400 truncate border-b border-slate-50 dark:border-slate-800 last:border-0">
                                <div className={`w-2 h-2 rounded-full mr-2 ${t.priority === 'high' ? 'bg-red-400' : 'bg-blue-400'}`} />
                                {t.title}
                             </div>
                          ))}
                       </div>
                    )}
                  </div>
               ))}
            </div>
         </div>

         {/* Main Grid */}
         <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
            <div className="min-w-max">
               {/* Days Header */}
               <div className="flex h-12 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                  {dateRange.map((d, i) => (
                     <div key={i} className="w-24 shrink-0 border-r border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className={`text-sm font-medium ${d.toDateString() === new Date().toDateString() ? 'text-primary-600 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}`}>
                           {d.getDate()}
                        </span>
                     </div>
                  ))}
               </div>

               {/* Grid Content */}
               <div>
                  {members.map(m => {
                     const isExpanded = expandedUsers.includes(m.user_id);
                     const userTasks = tasks.filter(t => t.assigned_to?.includes(m.user_id) && t.status !== 'done');

                     return (
                        <div key={m.id}>
                           {/* Capacity Row */}
                           <div className="flex h-14 border-b border-slate-50 dark:border-slate-800">
                              {dateRange.map((d, i) => {
                                 const effort = getDailyEffort(m.user_id, d);
                                 const percent = Math.min((effort / maxCap) * 100, 100);
                                 const isOver = effort > maxCap;
                                 const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                                 return (
                                    <div key={i} className={`w-24 shrink-0 border-r border-slate-100 dark:border-slate-800 p-2 relative ${isWeekend ? 'bg-slate-50/40 dark:bg-slate-800/20' : ''}`}>
                                       {effort > 0 && (
                                          <div className="h-full w-full flex flex-col justify-end relative group">
                                             <div 
                                                className={`w-full rounded-t-md transition-all duration-300 relative ${isOver ? 'bg-red-500' : 'bg-green-500'}`}
                                                style={{ height: `${percent}%`, minHeight: '4px' }}
                                             >
                                                {isOver && (
                                                   <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                                                )}
                                             </div>
                                             
                                             {/* Tooltip */}
                                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20">
                                                {effort.toFixed(1)} / {maxCap} {effortType}
                                             </div>
                                          </div>
                                       )}
                                    </div>
                                 );
                              })}
                           </div>

                           {/* Expanded Task Rows (Gantt-ish) */}
                           {isExpanded && (
                              <div className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                 {userTasks.map(t => (
                                    <div key={t.id} className="flex h-8 relative">
                                       {dateRange.map((d, i) => {
                                          const dStr = d.toISOString().split('T')[0];
                                          const start = t.start_date ? t.start_date.split('T')[0] : t.created_at.split('T')[0];
                                          const due = t.due_date ? t.due_date.split('T')[0] : start;
                                          
                                          const isStart = dStr === start;
                                          const isDuring = dStr >= start && dStr <= due;
                                          const isEnd = dStr === due;
                                          
                                          return (
                                             <div key={i} className="w-24 shrink-0 border-r border-slate-200/50 dark:border-slate-700/50 relative">
                                                {isDuring && (
                                                   <div 
                                                      className={`absolute top-1.5 bottom-1.5 left-0 right-0 bg-blue-200/60 dark:bg-blue-900/40 
                                                         ${isStart ? 'left-2 rounded-l-md' : ''}
                                                         ${isEnd ? 'right-2 rounded-r-md' : ''}
                                                      `}
                                                      onClick={() => onTaskClick(t)}
                                                   >
                                                      {isStart && (
                                                         <span className="absolute left-2 text-[9px] font-medium text-blue-800 dark:text-blue-200 truncate max-w-[150px] z-10 leading-5">
                                                            {t.title}
                                                         </span>
                                                      )}
                                                   </div>
                                                )}
                                             </div>
                                          );
                                       })}
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     );
                  })}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
