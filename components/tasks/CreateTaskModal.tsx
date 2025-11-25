
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { TaskPriority, ProjectMember, TaskStatus } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SmartDatePicker } from '../ui/SmartDatePicker';
import { X, Calendar, Flag, User, Paperclip, Check } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  defaultStatus?: TaskStatus;
  initialData?: {
    title?: string;
    description?: string;
  };
  initialAttachments?: string[]; // Array of URLs
  initialDate?: string; // New Prop: YYYY-MM-DD
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onSuccess, projectId, defaultStatus, initialData, initialAttachments, initialDate }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [members, setMembers] = useState<ProjectMember[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedToIds, setAssignedToIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  // Use ref to track if we've initialized from data for this open session
  const hasInitialized = useRef(false);

  // Click outside listener for assignee dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
            setIsAssigneeDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Only reset/init if we haven't for this open session or if date changes
      if (!hasInitialized.current || (initialDate && dueDate !== initialDate)) {
        setTitle(initialData?.title || '');
        setDescription(initialData?.description || '');
        setPriority('medium');
        setAssignedToIds([]);
        // Prefer initialDate if provided, otherwise check initialData or empty
        setDueDate(initialDate || ''); 
        setStatus(defaultStatus || 'todo');
        setError('');
        fetchMembers();
        hasInitialized.current = true;
      }
    } else {
      hasInitialized.current = false;
    }
  }, [isOpen, defaultStatus, initialData, projectId, initialDate]);

  const fetchMembers = async () => {
    try {
      const project = await projectService.getProject(projectId);
      if (project.members) {
        setMembers(project.members);
      }
    } catch (err) {
      console.error("Failed to fetch project members", err);
    }
  };

  const toggleAssignee = (userId: string) => {
      setAssignedToIds(prev => 
          prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      const newTask = await taskService.createTask({
        project_id: projectId,
        title,
        description,
        priority,
        assigned_to: assignedToIds, 
        due_date: dueDate || null,
        created_by: user.id,
        status: status
      });

      // Handle Initial Attachments (Copy from Idea Reference)
      if (initialAttachments && initialAttachments.length > 0) {
         await Promise.all(initialAttachments.map(url => 
            taskService.addTaskAttachmentFromUrl(newTask.id, url, 'Reference Image', user.id)
         ));
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg relative flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add New Task</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-md border border-red-100 dark:border-red-800">
              {error}
            </div>
          )}

          {initialAttachments && initialAttachments.length > 0 && (
             <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <Paperclip className="h-4 w-4" />
                <span>{initialAttachments.length} Reference image(s) will be attached.</span>
             </div>
          )}

          <div className="space-y-4">
            <Input
              label="Task Title"
              placeholder="What needs to be done?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              autoFocus
              className="text-slate-900 dark:text-white bg-white dark:bg-slate-800 dark:border-slate-700"
            />

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <textarea
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none min-h-[100px] resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                placeholder="Add details about this task..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 relative" ref={assigneeDropdownRef}>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                   <User className="h-3.5 w-3.5" /> Assignees
                </label>
                
                {/* Custom Multi-Select Trigger */}
                <div 
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white cursor-pointer flex items-center justify-between"
                    onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                >
                    <div className="flex flex-wrap gap-1">
                        {assignedToIds.length === 0 ? (
                            <span className="text-slate-500 dark:text-slate-400">Unassigned</span>
                        ) : (
                            assignedToIds.length <= 2 ? (
                                members.filter(m => assignedToIds.includes(m.user_id)).map(m => (
                                    <span key={m.user_id} className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs truncate max-w-[80px] dark:text-slate-200">
                                        {m.user?.full_name?.split(' ')[0]}
                                    </span>
                                ))
                            ) : (
                                <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs dark:text-slate-200">
                                    {assignedToIds.length} Selected
                                </span>
                            )
                        )}
                    </div>
                    <div className="ml-1 rotate-90 text-slate-400 dark:text-slate-500 text-[10px] font-bold">{'>'}</div>
                </div>

                {/* Dropdown List */}
                {isAssigneeDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                        {members.map(m => (
                            <div 
                                key={m.user_id} 
                                className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md cursor-pointer text-sm"
                                onClick={() => toggleAssignee(m.user_id)}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                        {m.user?.full_name?.[0]}
                                    </div>
                                    <span className="text-slate-700 dark:text-slate-200">{m.user?.full_name}</span>
                                </div>
                                {assignedToIds.includes(m.user_id) && <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
                            </div>
                        ))}
                    </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                   <Flag className="h-3.5 w-3.5" /> Priority
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={priority}
                  onChange={e => setPriority(e.target.value as TaskPriority)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Due Date
               </label>
               <SmartDatePicker 
                 value={dueDate || null}
                 onChange={(d) => setDueDate(d || '')}
                 variant="input"
                 placeholder="Select date"
                 className="w-full"
                 align="right"
               />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={onClose} className="dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800">Cancel</Button>
            <Button type="submit" isLoading={isLoading}>Create Task</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
