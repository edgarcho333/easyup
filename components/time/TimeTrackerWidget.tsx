
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { timeService } from '../../services/timeService';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { TimeLog, Project, Task } from '../../types';
import { Play, Square, Clock, Loader2, Briefcase, CheckSquare, ChevronDown } from 'lucide-react';

export const TimeTrackerWidget: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeLog, setActiveLog] = useState<TimeLog | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Selection Data
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');

  useEffect(() => {
    if (user) {
      checkActiveTimer();
    }
  }, [user]);

  // Auto-detect Project Context
  useEffect(() => {
    // Only proceed if timer is running AND no project is selected yet
    if (activeLog && !activeLog.project_id && !isLoading) {
      // Check if current URL is a project page (e.g. /projects/123...)
      const match = location.pathname.match(/\/projects\/([a-zA-Z0-9-]+)/);
      if (match && match[1]) {
        const detectedProjectId = match[1];
        
        // Update the active log
        timeService.updateLog(activeLog.id, { project_id: detectedProjectId })
          .then(updatedLog => {
             setActiveLog(updatedLog);
             setSelectedProjectId(detectedProjectId);
          })
          .catch(err => console.error("Failed to auto-track project context", err));
      }
    }
  }, [location.pathname, activeLog, isLoading]);

  // Load selection data when expanded and not running
  useEffect(() => {
    if (isExpanded && user?.currentOrganization && !activeLog) {
        const loadData = async () => {
            try {
                const [pData, tData] = await Promise.all([
                    projectService.getProjects(user.currentOrganization!.id, user.id, user.currentRole || 'client', 'active'),
                    taskService.getUserTasks(user.id)
                ]);
                setProjects(pData);
                // Filter out completed tasks
                setTasks(tData.filter(t => t.status !== 'done'));
            } catch (e) {
                console.error("Failed to load time tracker data", e);
            }
        };
        loadData();
    }
  }, [isExpanded, user, activeLog]);

  useEffect(() => {
    let interval: any;
    if (activeLog) {
      interval = setInterval(() => {
        const start = new Date(activeLog.start_time).getTime();
        const now = new Date().getTime();
        setElapsed(Math.floor((now - start) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeLog]);

  const checkActiveTimer = async () => {
    if (!user) return;
    try {
      const log = await timeService.getActiveLog(user.id);
      setActiveLog(log);
      if (log) {
        setDescription(log.description || '');
        setSelectedProjectId(log.project_id || '');
        setIsExpanded(false); // Minimize on load if running
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    if (!user?.currentOrganization) return;
    setIsLoading(true);
    try {
      const log = await timeService.startTimer(
        user.id, 
        user.currentOrganization.id, 
        description || 'General Work',
        selectedProjectId || undefined,
        selectedTaskId || undefined
      );
      setActiveLog(log);
      setIsExpanded(false); // Auto minimize on start
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (!activeLog) return;
    setIsLoading(true);
    try {
      await timeService.stopTimer(activeLog.id);
      setActiveLog(null);
      setDescription('');
      setSelectedProjectId('');
      setSelectedTaskId('');
      setElapsed(0);
      setIsExpanded(false); // Collapse on stop
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const taskId = e.target.value;
      setSelectedTaskId(taskId);
      if (taskId) {
          const task = tasks.find(t => t.id === taskId);
          if (task) {
              if (task.project_id) setSelectedProjectId(task.project_id);
              if (!description) setDescription(task.title);
          }
      }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  if (!user) return null;

  // Minimized State (Just an Icon)
  if (!isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className={`h-14 w-14 rounded-full shadow-xl transition-all flex items-center justify-center group border-4 
          ${activeLog 
            ? 'bg-white dark:bg-slate-800 border-green-500 text-green-600 dark:text-green-400' 
            : 'bg-slate-900 dark:bg-primary-600 border-slate-50 dark:border-primary-500 text-white hover:border-slate-100 dark:hover:border-primary-400 hover:scale-110'
          }`}
        title={activeLog ? "Timer Running" : "Track Time"}
      >
        {activeLog ? (
           <div className="flex flex-col items-center justify-center leading-none relative">
              <Clock className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>
           </div>
        ) : (
           <Clock className="h-6 w-6 group-hover:rotate-12 transition-transform" />
        )}
      </button>
    );
  }

  // Expanded Widget
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 w-[300px] animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
      
      {/* Header / Close */}
      <div className="flex justify-between items-center">
         <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
                {activeLog ? 'Timer Running' : 'Time Tracker'}
            </span>
         </div>
         <button onClick={() => setIsExpanded(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
           <ChevronDown className="h-5 w-5" />
         </button>
      </div>

      {/* Timer Display */}
      <div className="text-center py-1">
         <div className={`text-4xl font-mono font-bold tracking-tight tabular-nums ${activeLog ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-600'}`}>
            {activeLog ? formatTime(elapsed) : '00:00:00'}
         </div>
         {activeLog?.project && (
             <div className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-1 bg-primary-50 dark:bg-primary-900/30 inline-block px-2 py-0.5 rounded-full truncate max-w-[250px]">
                 {activeLog.project.name}
             </div>
         )}
      </div>

      {/* Inputs (Only visible when NOT running or minimal info when running) */}
      {!activeLog ? (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            
            {/* Project Select */}
            <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <select 
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                    <option value="">Select Project (Optional)</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {/* Task Select */}
            <div className="relative">
                <CheckSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <select 
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                    value={selectedTaskId}
                    onChange={handleTaskSelect}
                >
                    <option value="">Select Task (Optional)</option>
                    {tasks.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                </select>
            </div>

            {/* Description */}
            <input 
                className="text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-slate-400 dark:text-white transition-all"
                placeholder="What are you working on?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                autoFocus={isExpanded && !activeLog}
            />
        </div>
      ) : (
        <div className="text-center px-2">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">{description || 'No description'}</p>
        </div>
      )}

      {/* Action Button */}
      {isLoading ? (
         <div className="h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg">
           <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
         </div>
      ) : activeLog ? (
        <button 
          onClick={handleStop} 
          className="flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 font-semibold py-2.5 rounded-lg transition-colors group"
        >
          <Square className="h-4 w-4 fill-current group-hover:scale-110 transition-transform" /> Stop Timer
        </button>
      ) : (
        <button 
          onClick={handleStart} 
          className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-primary-600 text-white hover:bg-slate-800 dark:hover:bg-primary-700 font-semibold py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg group"
        >
          <Play className="h-4 w-4 fill-current group-hover:scale-110 transition-transform" /> Start Timer
        </button>
      )}
      
      {activeLog && (
         <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-white dark:border-slate-800 shadow-sm"></div>
      )}
    </div>
  );
};
