
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task } from '../../types';
import { taskService } from '../../services/taskService';
import { Loader2, User, Calendar, AlertCircle } from 'lucide-react';

interface TaskTimelineProps {
  projectId: string;
  refreshTrigger: number;
  onTaskClick: (task: Task) => void;
}

const CELL_WIDTH = 50; // Width of one day in pixels
const HEADER_HEIGHT = 60;
const ROW_HEIGHT = 60; // Taller rows to accommodate avatars

export const TaskTimeline: React.FC<TaskTimelineProps> = ({ projectId, refreshTrigger, onTaskClick }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTasks();
  }, [projectId, refreshTrigger]);

  const fetchTasks = async () => {
    try {
      const data = await taskService.getProjectTasks(projectId);
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Date Helpers ---
  const getMinDate = () => {
    if (tasks.length === 0) return new Date();
    const dates = tasks.map(t => new Date(t.start_date || t.created_at)).filter(d => !isNaN(d.getTime()));
    if (dates.length === 0) return new Date();
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    min.setDate(min.getDate() - 3); // buffer
    return min;
  };

  const getMaxDate = () => {
    if (tasks.length === 0) return new Date();
    const dates = tasks.map(t => new Date(t.due_date || t.created_at)).filter(d => !isNaN(d.getTime()));
    if (dates.length === 0) return new Date();
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    max.setDate(max.getDate() + 14); // buffer
    return max;
  };

  const minDate = useMemo(getMinDate, [tasks]);
  const maxDate = useMemo(getMaxDate, [tasks]);

  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // --- Positioning Logic ---
  const getX = (dateString?: string) => {
    if (!dateString) return 0;
    const date = new Date(dateString);
    const diffTime = date.getTime() - minDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * CELL_WIDTH;
  };

  const getWidth = (start?: string, end?: string) => {
    const s = start ? new Date(start) : new Date();
    const e = end ? new Date(end) : new Date(s);
    // Ensure end is at least same day or later
    if (e < s) e.setDate(s.getDate()); 
    
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24))) + 1; // +1 to include end day
    return diffDays * CELL_WIDTH;
  };

  // --- Render Connectors (Bezier Curves) ---
  const renderConnectors = () => {
    return tasks.flatMap((task, index) => {
      if (!task.dependencies || task.dependencies.length === 0) return [];

      // Current Task Position
      const taskX = getX(task.start_date || task.created_at);
      const taskY = index * ROW_HEIGHT + (ROW_HEIGHT / 2);

      return task.dependencies.map(depId => {
        const parentIndex = tasks.findIndex(t => t.id === depId);
        const parentTask = tasks[parentIndex];
        if (!parentTask) return null;

        // Parent Task Position (End of parent)
        const parentX = getX(parentTask.start_date || parentTask.created_at) + getWidth(parentTask.start_date || parentTask.created_at, parentTask.due_date || parentTask.created_at);
        const parentY = parentIndex * ROW_HEIGHT + (ROW_HEIGHT / 2);

        // Path Calculation
        const midX = (parentX + taskX) / 2;
        
        // Draw curved line
        // M startX startY C cp1x cp1y, cp2x cp2y, endX endY
        const path = `M ${parentX} ${parentY} C ${midX} ${parentY}, ${midX} ${taskY}, ${taskX} ${taskY}`;

        return (
          <g key={`${depId}-${task.id}`}>
             <path d={path} fill="none" stroke="#94a3b8" strokeWidth="2" strokeOpacity="0.6" />
             <circle cx={taskX} cy={taskY} r="3" fill="#64748b" />
          </g>
        );
      });
    });
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        <Calendar className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No Timeline Data</h3>
        <p className="text-slate-500 dark:text-slate-400">Add tasks with start and due dates to see the timeline.</p>
      </div>
    );
  }

  const chartWidth = totalDays * CELL_WIDTH;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto custom-scrollbar" ref={containerRef}>
        <div style={{ width: chartWidth, minWidth: '100%' }} className="relative bg-slate-50/50 dark:bg-slate-900/50 min-h-[500px]">
          
          {/* 1. Time Axis Header */}
          <div className="sticky top-0 z-20 flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm h-[60px]">
             {Array.from({ length: totalDays }).map((_, i) => {
                const d = new Date(minDate);
                d.setDate(d.getDate() + i);
                const isFirstOfMonth = d.getDate() === 1 || i === 0;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                
                return (
                  <div 
                    key={i} 
                    style={{ width: CELL_WIDTH }} 
                    className={`shrink-0 border-r border-slate-100 dark:border-slate-800 flex flex-col items-center justify-end pb-2 text-xs ${isWeekend ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-900'}`}
                  >
                     {isFirstOfMonth && (
                        <div className="absolute top-1 left-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                           {d.toLocaleString('default', { month: 'short', year: '2-digit' })}
                        </div>
                     )}
                     <span className={`font-medium ${isWeekend ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>{d.getDate()}</span>
                     <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                  </div>
                );
             })}
          </div>

          {/* 2. Grid Background */}
          <div className="absolute inset-0 top-[60px] z-0 flex pointer-events-none">
             {Array.from({ length: totalDays }).map((_, i) => {
                const d = new Date(minDate);
                d.setDate(d.getDate() + i);
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div key={i} style={{ width: CELL_WIDTH }} className={`shrink-0 border-r border-slate-100 dark:border-slate-800 h-full ${isWeekend ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}`} />
                );
             })}
          </div>

          {/* 3. Dependency Lines Layer */}
          <svg className="absolute inset-0 top-[60px] z-0 pointer-events-none" style={{ width: chartWidth, height: tasks.length * ROW_HEIGHT }}>
             {renderConnectors()}
          </svg>

          {/* 4. Tasks Layer */}
          <div className="relative z-10 mt-4">
             {tasks.map((task, index) => {
                const x = getX(task.start_date || task.created_at);
                const w = getWidth(task.start_date || task.created_at, task.due_date || task.created_at);
                const isDone = task.status === 'done';
                
                // Color Logic based on status/priority
                let barColor = 'bg-blue-500 border-blue-600 dark:bg-blue-600 dark:border-blue-700';
                let textColor = 'text-white';
                
                if (task.status === 'done') { barColor = 'bg-green-500 border-green-600 dark:bg-green-600 dark:border-green-700'; }
                else if (task.status === 'review') { barColor = 'bg-amber-500 border-amber-600 dark:bg-amber-600 dark:border-amber-700'; }
                else if (task.status === 'in_progress') { barColor = 'bg-indigo-500 border-indigo-600 dark:bg-indigo-600 dark:border-indigo-700'; }
                else if (task.priority === 'high') { barColor = 'bg-red-500 border-red-600 dark:bg-red-600 dark:border-red-700'; }

                return (
                   <div 
                     key={task.id} 
                     className="relative flex items-center group"
                     style={{ height: ROW_HEIGHT }}
                   >
                      {/* Task Bar */}
                      <div 
                        onClick={() => onTaskClick(task)}
                        className={`
                           absolute rounded-lg border shadow-sm cursor-pointer transition-all hover:shadow-md hover:brightness-110 flex items-center px-3 overflow-hidden
                           ${barColor} ${textColor}
                        `}
                        style={{ 
                           left: x, 
                           width: w, 
                           height: 36,
                           opacity: isDone ? 0.6 : 1
                        }}
                      >
                         <span className="truncate text-xs font-bold drop-shadow-md">{task.title}</span>
                      </div>

                      {/* Avatars (Right of bar) */}
                      <div 
                        className="absolute flex items-center -space-x-2"
                        style={{ left: x + w + 8 }}
                      >
                         {task.assignees && task.assignees.length > 0 ? (
                            task.assignees.slice(0, 3).map(u => (
                                <img 
                                  key={u.id}
                                  src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name}`} 
                                  alt={u.full_name} 
                                  className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-800 shadow-sm object-cover bg-slate-200 dark:bg-slate-700"
                                  title={u.full_name}
                                />
                            ))
                         ) : (
                            <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500">
                               <User className="h-4 w-4" />
                            </div>
                         )}
                      </div>
                   </div>
                );
             })}
          </div>

        </div>
      </div>
    </div>
  );
};
