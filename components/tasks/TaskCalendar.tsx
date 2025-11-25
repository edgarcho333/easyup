
import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { taskService } from '../../services/taskService';
import { 
  Loader2, ChevronLeft, ChevronRight, Plus, 
  CheckCircle2
} from 'lucide-react';

interface TaskCalendarProps {
  projectId: string;
  refreshTrigger: number;
  onTaskClick: (task: Task) => void;
  onAddClick?: (date: string) => void;
}

export const TaskCalendar: React.FC<TaskCalendarProps> = ({ projectId, refreshTrigger, onTaskClick, onAddClick }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const handleToggleStatus = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus as TaskStatus } : t));

    try {
      await taskService.updateTaskStatus(task.id, newStatus as TaskStatus);
    } catch (err) {
      console.error(err);
      fetchTasks();
    }
  };

  // --- Calendar Logic ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    return { days, firstDay };
  };

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + (direction === 'next' ? 1 : -1), 1));
  };

  const jumpToToday = () => setCurrentDate(new Date());

  const daysInMonth = getDaysInMonth(currentDate);
  
  const calendarCells = useMemo(() => {
    const cells = [];
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    
    // Previous Month Padding
    for (let i = 0; i < daysInMonth.firstDay; i++) {
      cells.push({
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevMonth.getDate() - (daysInMonth.firstDay - 1) + i),
        isCurrentMonth: false
      });
    }

    // Current Month
    for (let i = 1; i <= daysInMonth.days; i++) {
      cells.push({
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i),
        isCurrentMonth: true
      });
    }

    // Next Month Padding - Fill the rest of the week row
    const totalSoFar = cells.length;
    const remaining = 7 - (totalSoFar % 7);
    if (remaining < 7) {
        for (let i = 1; i <= remaining; i++) {
            cells.push({
                date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i),
                isCurrentMonth: false
            });
        }
    }

    return cells;
  }, [currentDate, daysInMonth]);

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(t => t.due_date && t.due_date.startsWith(dateStr));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
      {/* --- Header --- */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
            <button onClick={() => navigate('prev')} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm text-slate-500 dark:text-slate-400 transition-all">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => navigate('next')} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm text-slate-500 dark:text-slate-400 transition-all">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button 
            onClick={jumpToToday} 
            className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            Today
          </button>
        </div>
      </div>

      {/* --- Weekday Header --- */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="py-3 text-center">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{day.substring(0, 3)}</span>
          </div>
        ))}
      </div>

      {/* --- Calendar Grid (Auto Height) --- */}
      <div className="grid grid-cols-7 bg-slate-200 dark:bg-slate-800 gap-px border-b border-slate-200 dark:border-slate-800">
        {calendarCells.map((cell, index) => {
          const dayTasks = getTasksForDate(cell.date);
          const isCurrentDay = isToday(cell.date);
          const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;
          const dateString = cell.date.toISOString().split('T')[0];

          return (
            <div 
              key={index}
              onClick={() => onAddClick && onAddClick(dateString)}
              className={`
                relative flex flex-col p-3 transition-colors group min-h-[160px]
                ${cell.isCurrentMonth ? 'bg-white dark:bg-slate-900' : 'bg-[#FAFAFA] dark:bg-[#0f172a] text-slate-400 dark:text-slate-600'}
                ${isWeekend && cell.isCurrentMonth ? 'bg-[#FCFCFC] dark:bg-[#111c33]' : ''} 
                hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer
              `}
            >
              {/* Date Indicator */}
              <div className="flex justify-between items-start mb-3">
                {isCurrentDay ? (
                  <div className="flex flex-col items-center -ml-1.5">
                    <div className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold shadow-md">
                      {cell.date.getDate()}
                    </div>
                  </div>
                ) : (
                  <span className={`text-sm font-medium ${cell.isCurrentMonth ? 'text-slate-700 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600'}`}>
                    {cell.date.getDate()}
                  </span>
                )}

                {/* Add Button */}
                <button 
                  onClick={(e) => { e.stopPropagation(); onAddClick && onAddClick(dateString); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-full"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Tasks Stack */}
              <div className="flex flex-col gap-1.5">
                {dayTasks.map(task => {
                  const isDone = task.status === 'done';
                  return (
                    <div 
                      key={task.id}
                      onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                      className={`
                        group/card relative flex items-center p-2.5 bg-white dark:bg-slate-800 border rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer
                        ${isDone ? 'border-slate-100 dark:border-slate-800 opacity-60' : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600'}
                      `}
                    >
                      {/* Priority Color Strip */}
                      <div className={`absolute left-0 top-1 bottom-1 w-1 rounded-r-full ${getPriorityColor(task.priority)}`} />

                      <div className="flex items-start gap-2.5 pl-2 w-full">
                        <div 
                          onClick={(e) => handleToggleStatus(e, task)}
                          className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all
                            ${isDone 
                                ? 'bg-slate-400 border-slate-400 dark:bg-slate-600 dark:border-slate-600 text-white' 
                                : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-green-500 group-hover/card:border-slate-400'}
                          `}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold leading-snug truncate ${isDone ? 'text-slate-500 dark:text-slate-500 line-through decoration-slate-300' : 'text-slate-700 dark:text-slate-200'}`}>
                            {task.title}
                          </p>
                        </div>
                        
                        {task.assignee && (
                           <img 
                             src={task.assignee.avatar_url || `https://ui-avatars.com/api/?name=${task.assignee.full_name}`} 
                             alt="" 
                             className="w-5 h-5 rounded-full border border-white dark:border-slate-700 shadow-sm object-cover shrink-0 opacity-90"
                           />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case 'high': return 'bg-red-500';
    case 'medium': return 'bg-amber-400';
    case 'low': return 'bg-blue-400';
    default: return 'bg-slate-300 dark:bg-slate-600';
  }
};
