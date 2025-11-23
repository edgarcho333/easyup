
import React from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { Calendar, User as UserIcon, MoreHorizontal, Paperclip, MessageSquare } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onClick?: (task: Task) => void;
}

const priorityStyles: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-blue-50 text-blue-600 border-blue-100',
  high: 'bg-red-50 text-red-600 border-red-100',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onDelete, onClick }) => {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  // Mock counts if not in types yet, or hide
  const hasAttachments = false; 
  const hasComments = false;

  return (
    <div 
      onClick={() => onClick && onClick(task)}
      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all group cursor-pointer relative"
    >
      <div className="flex justify-between items-start mb-2.5">
        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wide border ${priorityStyles[task.priority]}`}>
          {task.priority}
        </span>
        
        <div className="relative group/menu" onClick={e => e.stopPropagation()}>
          <button className="text-slate-400 hover:text-slate-600 p-1 transition-opacity rounded hover:bg-slate-100">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-20 hidden group-hover/menu:block animate-in fade-in zoom-in-95 duration-75">
             <div className="py-1">
                {task.status !== 'done' && <button onClick={() => onStatusChange(task.id, 'done')} className="block w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">Mark Done</button>}
                <button onClick={() => onDelete(task.id)} className="block w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">Delete</button>
             </div>
          </div>
        </div>
      </div>

      <h4 className={`font-semibold text-slate-900 text-sm mb-1.5 leading-snug ${task.status === 'done' ? 'line-through text-slate-400' : ''}`}>
         {task.title}
      </h4>
      
      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-2">
        <div className="flex items-center gap-2">
           {task.assignee ? (
             <div className="flex items-center gap-1" title={`Assigned to ${task.assignee.full_name}`}>
               <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 border border-white shadow-sm flex items-center justify-center text-[10px] font-bold">
                 {task.assignee.full_name?.[0]}
               </div>
             </div>
           ) : (
             <div className="h-6 w-6 rounded-full bg-slate-100 border border-dashed border-slate-300 text-slate-400 flex items-center justify-center" title="Unassigned">
               <UserIcon className="h-3 w-3" />
             </div>
           )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
            {(hasComments || hasAttachments) && (
                <div className="flex gap-2">
                   {hasComments && <MessageSquare className="h-3.5 w-3.5" />}
                   {hasAttachments && <Paperclip className="h-3.5 w-3.5" />}
                </div>
            )}
            {task.due_date && (
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${isOverdue ? 'bg-red-50 text-red-600 font-medium' : 'bg-slate-50 text-slate-500'}`}>
                <Calendar className="h-3 w-3" />
                <span>{new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};
