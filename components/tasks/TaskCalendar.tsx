
import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskPriority } from '../../types';
import { taskService } from '../../services/taskService';
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface TaskCalendarProps {
  projectId: string;
  refreshTrigger: number;
  onTaskClick: (task: Task) => void;
}

export const TaskCalendar: React.FC<TaskCalendarProps> = ({ projectId, refreshTrigger, onTaskClick }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const data = await taskService.getProjectTasks(projectId);
        setTasks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [projectId, refreshTrigger]);

  // --- Calendar Logic ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const daysInCurrentMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month); // 0 = Sun, 1 = Mon...
    
    const daysInPrevMonth = getDaysInMonth(year, month - 1);
    
    const grid = [];

    // Previous Month Fillers
    for (let i = firstDay - 1; i >= 0; i--) {
      grid.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
        isToday: false
      });
    }

    // Current Month Days
    const today = new Date();
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const date = new Date(year, month, i);
      grid.push({
        date: date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString()
      });
    }

    // Next Month Fillers (to complete 42 cells - 6 rows)
    const remainingCells = 42 - grid.length;
    for (let i = 1; i <= remainingCells; i++) {
      grid.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isToday: false
      });
    }

    return grid;
  }, [currentDate]);

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getTasksForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return tasks.filter(t => t.due_date && t.due_date.startsWith(dateString));
  };

  const getPriorityStyles = (priority: TaskPriority, isDone: boolean) => {
    if (isDone) return 'bg-slate-100 border-slate-200 text-slate-400 decoration-slate-400 line-through';
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-100 text-red-700 hover:bg-red-100';
      case 'medium': return 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100';
      case 'low': return 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100';
      default: return 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100';
    }
  };

  const getPriorityIcon = (priority: TaskPriority) => {
     switch (priority) {
        case 'high': return <AlertCircle className="h-3 w-3" />;
        case 'medium': return <Clock className="h-3 w-3" />;
        default: return null;
     }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[800px] animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button onClick={prevMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-500 hover:text-slate-900 transition-all">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-500 hover:text-slate-900 transition-all">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button 
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-sm"
          >
            Today
          </button>
        </div>
        
        {/* Legend / Stats */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-red-500"></div> High Priority
            </div>
            <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-amber-500"></div> Medium
            </div>
            <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-blue-500"></div> Low
            </div>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 bg-slate-200 gap-px overflow-hidden">
        {calendarGrid.map((dayInfo, index) => {
          const dayTasks = getTasksForDate(dayInfo.date);
          const isWeekend = dayInfo.date.getDay() === 0 || dayInfo.date.getDay() === 6;

          return (
            <div 
              key={index} 
              className={`
                bg-white flex flex-col p-2 min-h-[100px] transition-colors group
                ${!dayInfo.isCurrentMonth ? 'bg-slate-50/50 text-slate-400' : 'text-slate-900'}
                ${dayInfo.isToday ? 'bg-blue-50/10' : ''}
                hover:bg-slate-50
              `}
            >
              {/* Date Number */}
              <div className="flex justify-between items-start mb-1">
                 <span className={`
                    text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-all
                    ${dayInfo.isToday 
                      ? 'bg-primary-600 text-white shadow-md' 
                      : !dayInfo.isCurrentMonth ? 'text-slate-400' : 'text-slate-700'}
                 `}>
                   {dayInfo.date.getDate()}
                 </span>
                 {dayInfo.isToday && (
                    <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider mt-1.5 mr-1">Today</span>
                 )}
              </div>

              {/* Tasks List */}
              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar px-0.5 pb-1">
                 {dayTasks.map(task => {
                   const isDone = task.status === 'done';
                   return (
                     <button
                        key={task.id}
                        onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                        className={`
                          w-full text-left px-2 py-1.5 rounded-md border text-xs font-medium transition-all shadow-sm
                          flex items-center gap-2 group/task
                          ${getPriorityStyles(task.priority, isDone)}
                        `}
                     >
                        {isDone ? (
                           <CheckCircle2 className="h-3 w-3 shrink-0 text-slate-400" />
                        ) : (
                           <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              task.priority === 'high' ? 'bg-red-500' :
                              task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                           }`} />
                        )}
                        <span className="truncate flex-1">{task.title}</span>
                        
                        {/* Assigned Avatar Mini */}
                        {task.assignee && !isDone && (
                           <div className="h-4 w-4 rounded-full bg-white/50 border border-black/5 flex items-center justify-center text-[8px] font-bold shrink-0">
                              {task.assignee.full_name?.[0]}
                           </div>
                        )}
                     </button>
                   );
                 })}
                 
                 {/* Empty State for Today (if no tasks) */}
                 {dayInfo.isToday && dayTasks.length === 0 && (
                    <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="text-xs text-slate-400 flex items-center gap-1 hover:text-primary-600 hover:bg-primary-50 px-2 py-1 rounded">
                          <Plus className="h-3 w-3" /> Add
                       </button>
                    </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
