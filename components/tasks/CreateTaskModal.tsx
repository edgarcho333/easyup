
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { TaskPriority, ProjectMember, TaskStatus } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SmartDatePicker } from '../ui/SmartDatePicker';
import { X, Calendar, Flag, User, Paperclip } from 'lucide-react';

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
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onSuccess, projectId, defaultStatus, initialData, initialAttachments }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [members, setMembers] = useState<ProjectMember[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');

  // Use ref to track if we've initialized from data for this open session
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isOpen) {
      // Only reset/init if we haven't for this open session
      if (!hasInitialized.current) {
        setTitle(initialData?.title || '');
        setDescription(initialData?.description || '');
        setPriority('medium');
        setAssignedTo('');
        setDueDate('');
        setStatus(defaultStatus || 'todo');
        setError('');
        fetchMembers();
        hasInitialized.current = true;
      }
    } else {
      hasInitialized.current = false;
    }
  }, [isOpen, defaultStatus, initialData?.title, initialData?.description, projectId]);

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
        assigned_to: assignedTo || null, // Allow unassigned
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900">Add New Task</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
              {error}
            </div>
          )}

          {initialAttachments && initialAttachments.length > 0 && (
             <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center gap-2 text-sm text-blue-700">
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
              className="text-slate-900 bg-white"
            />

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:outline-none min-h-[100px] resize-none placeholder:text-slate-400"
                placeholder="Add details about this task..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                   <User className="h-3.5 w-3.5" /> Assignee
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                >
                  <option value="" className="text-slate-500">Unassigned</option>
                  {members.map(m => (
                    <option key={m.user_id} value={m.user_id} className="text-slate-900">
                      {m.user?.full_name} ({m.role?.display_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                   <Flag className="h-3.5 w-3.5" /> Priority
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={priority}
                  onChange={e => setPriority(e.target.value as TaskPriority)}
                >
                  <option value="low" className="text-slate-900">Low</option>
                  <option value="medium" className="text-slate-900">Medium</option>
                  <option value="high" className="text-slate-900">High</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
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

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={isLoading}>Create Task</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
