
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../../types';
import { taskService } from '../../services/taskService';
import { TaskCard } from './TaskCard';
import { Loader2, Circle, Clock, AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import { CreateTaskModal } from './CreateTaskModal';

interface KanbanBoardProps {
  projectId: string;
  refreshTrigger: number;
  onTaskClick?: (task: Task) => void;
  assigneeIdFilter?: string | null;
}

const COLUMNS: { id: TaskStatus; label: string; icon: any; color: string, bg: string, border: string }[] = [
  { id: 'todo', label: 'To Do', icon: Circle, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
  { id: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50/50', border: 'border-blue-100' },
  { id: 'review', label: 'Review', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50/50', border: 'border-amber-100' },
  { id: 'done', label: 'Done', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50/50', border: 'border-green-100' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId, refreshTrigger, onTaskClick, assigneeIdFilter }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState<TaskStatus>('todo');
  const [localRefresh, setLocalRefresh] = useState(0);

  useEffect(() => {
    fetchTasks();
  }, [projectId, refreshTrigger, localRefresh]);

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

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const previousTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await taskService.updateTaskStatus(taskId, newStatus);
    } catch (err) {
      console.error("Failed to update status", err);
      setTasks(previousTasks);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    
    const previousTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      await taskService.deleteTask(taskId);
    } catch (err) {
      console.error("Failed to delete task", err);
      setTasks(previousTasks);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = "move";
    // Optional: styling drag image if needed
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    
    if (taskId) {
      await handleStatusChange(taskId, status);
    }
    setDraggedTaskId(null);
  };
  
  const filteredTasks = assigneeIdFilter 
     ? tasks.filter(t => t.assigned_to === assigneeIdFilter)
     : tasks;

  const openCreateModal = (status: TaskStatus) => {
     setInitialStatus(status);
     setCreateModalOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;
  }

  return (
    <>
      <div className="flex overflow-x-auto pb-6 gap-4 sm:gap-6 h-[calc(100vh-280px)] min-h-[500px] px-1 snap-x snap-mandatory">
        {COLUMNS.map(col => {
          const Icon = col.icon;
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          
          return (
            <div 
              key={col.id} 
              className={`flex-shrink-0 w-[85vw] sm:w-[320px] flex flex-col rounded-2xl border ${col.border} ${col.bg} transition-colors snap-center`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg bg-white shadow-sm`}>
                     <Icon className={`h-4 w-4 ${col.color}`} />
                  </div>
                  <span className="font-bold text-slate-700">{col.label}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/60 text-slate-500 text-xs font-medium border border-slate-100">
                    {colTasks.length}
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={() => openCreateModal(col.id)} 
                  className="text-slate-400 hover:text-slate-700 hover:bg-white/80 p-1.5 rounded-md transition-all"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {/* Task List */}
              <div className={`flex-1 px-3 pb-3 overflow-y-auto space-y-3 custom-scrollbar`}>
                {colTasks.map(task => (
                  <div 
                    key={task.id} 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className={`transform transition-all duration-200 ${draggedTaskId === task.id ? 'opacity-50 rotate-2 scale-95' : 'hover:-translate-y-0.5'}`}
                  >
                    <TaskCard 
                      task={task} 
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      onClick={onTaskClick}
                    />
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div className="h-32 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200/50 rounded-xl">
                     <p className="text-xs font-medium">No tasks</p>
                     <button onClick={() => openCreateModal(col.id)} className="mt-2 text-xs text-primary-600 font-medium hover:underline">
                       + Create one
                     </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 pt-0 shrink-0">
                 <button 
                    type="button"
                    onClick={() => openCreateModal(col.id)}
                    className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-white/60 rounded-xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm"
                 >
                    <Plus className="h-3.5 w-3.5" /> Add Task
                 </button>
              </div>
            </div>
          );
        })}
      </div>

      <CreateTaskModal 
         isOpen={createModalOpen}
         onClose={() => setCreateModalOpen(false)}
         onSuccess={() => setLocalRefresh(p => p + 1)}
         projectId={projectId}
         defaultStatus={initialStatus}
      />
    </>
  );
};