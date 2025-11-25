
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Task, TaskPriority, TaskStatus, ProjectMember, TaskComment, TaskChecklistItem, TaskAttachment } from '../../types';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { Button } from '../ui/Button';
import { X, Calendar, Flag, User, CheckCircle2, Trash2, Plus, CheckSquare, Send, Paperclip, FileText, Download, Clock, File, ChevronDown, Link, Check } from 'lucide-react';
import { newId } from '../../lib/mockDb';
import { SmartDatePicker } from '../ui/SmartDatePicker';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  projectId?: string; 
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, isOpen, onClose, onUpdate, projectId }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedToIds, setAssignedToIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<TaskChecklistItem[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]); 
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Multi-select dropdown state
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  // Determine active project ID either from prop or task
  const activeProjectId = projectId || task?.project_id;

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
    if (isOpen && task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setAssignedToIds(task.assigned_to || []);
      setDueDate(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : null);
      setChecklist(task.checklist || []);
      setDependencies(task.dependencies || []);
      
      if (activeProjectId) {
        fetchMembers(activeProjectId);
        fetchProjectTasks(activeProjectId);
      }
      fetchComments(task.id);
      fetchAttachments(task.id);
    }
  }, [isOpen, task, activeProjectId]);

  const fetchMembers = async (pid: string) => {
    try {
      const project = await projectService.getProject(pid);
      if (project.members) {
        setMembers(project.members);
      }
    } catch (err) {
      console.error("Failed to fetch members", err);
    }
  };

  const fetchProjectTasks = async (pid: string) => {
    try {
      const data = await taskService.getProjectTasks(pid);
      setProjectTasks(data);
    } catch (err) {
      console.error("Failed to fetch project tasks", err);
    }
  };

  const fetchComments = async (taskId: string) => {
    try {
      const data = await taskService.getTaskComments(taskId);
      setComments(data);
    } catch (err) {
      console.error("Failed to fetch comments", err);
    }
  };

  const fetchAttachments = async (taskId: string) => {
    try {
        const data = await taskService.getTaskAttachments(taskId);
        setAttachments(data);
    } catch(err) {
        console.error("Failed to fetch attachments", err);
    }
  }

  // Dependency Handlers
  const addDependency = (depId: string) => {
    if (depId && !dependencies.includes(depId)) {
        setDependencies([...dependencies, depId]);
    }
  };

  const removeDependency = (depId: string) => {
      setDependencies(dependencies.filter(id => id !== depId));
  };

  const toggleAssignee = (userId: string) => {
      setAssignedToIds(prev => 
          prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      );
  };

  const handleAutoSave = async () => {
    if (!task) return;
    setIsSaving(true);
    try {
      await taskService.updateTask(task.id, {
        title,
        description,
        status,
        priority,
        assigned_to: assignedToIds,
        due_date: dueDate || undefined, 
        checklist,
        dependencies
      });
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save debounce
  useEffect(() => {
    if(isOpen && task) {
        const timeout = setTimeout(handleAutoSave, 1500);
        return () => clearTimeout(timeout);
    }
  }, [title, description, status, priority, assignedToIds, dueDate, checklist, dependencies]);

  const handleDelete = async () => {
    if (!task || !window.confirm("Delete this task?")) return;
    try {
      await taskService.deleteTask(task.id);
      addToast('Task deleted', 'info');
      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      addToast('Failed to delete task', 'error');
    }
  };

  const markComplete = async () => {
    if (!task) return;
    const newStatus = status === 'done' ? 'todo' : 'done';
    setStatus(newStatus);
    try {
        await taskService.updateTaskStatus(task.id, newStatus);
        addToast(newStatus === 'done' ? 'Task completed!' : 'Task reopened', 'success');
        onUpdate();
    } catch(err) {
        console.error(err);
    }
  };

  // Checklist Logic
  const addChecklistItem = () => {
    setChecklist([...checklist, { id: newId(), text: '', completed: false }]);
  };
  const updateChecklistItem = (id: string, text: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, text } : item));
  };
  const toggleChecklistItem = (id: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };
  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  // Comments Logic
  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !user || !newComment.trim()) return;
    try {
      await taskService.addTaskComment(task.id, user.id, newComment);
      setNewComment('');
      fetchComments(task.id);
      addToast('Comment added', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  // Attachments Logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task || !user || !e.target.files || !e.target.files[0]) return;
    try {
        const file = e.target.files[0];
        await taskService.addTaskAttachment(task.id, file, user.id);
        fetchAttachments(task.id);
        addToast('Attachment uploaded', 'success');
    } catch(err) {
        console.error(err);
        addToast('Upload failed', 'error');
    }
  };

  const deleteAttachment = async (attId: string) => {
      if(!window.confirm("Delete this attachment?")) return;
      try {
          await taskService.deleteTaskAttachment(attId);
          if(task) fetchAttachments(task.id);
          addToast('Attachment removed', 'info');
      } catch(err) { console.error(err); }
  };

  if (!isOpen || !task) return null;

  const assignedMembers = members.filter(m => assignedToIds.includes(m.user_id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex gap-3">
             <Button 
                variant="outline"
                className={`
                  transition-all font-semibold shadow-sm border-2 dark:bg-slate-800
                  ${status === 'done' 
                    ? 'bg-green-50 text-green-700 border-green-200 dark:border-green-900 hover:bg-green-100 dark:hover:bg-green-900/30' 
                    : 'bg-white text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-green-500 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                  }
                `} 
                onClick={markComplete}
             >
                <CheckCircle2 className={`h-4 w-4 mr-2 ${status === 'done' ? 'fill-green-600 text-white dark:text-slate-900' : 'text-slate-400 dark:text-slate-500 group-hover:text-green-600'}`} /> 
                {status === 'done' ? 'Completed' : 'Mark Complete'}
             </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
               {isSaving && <Clock className="h-3 w-3 animate-spin" />} 
               {isSaving ? 'Saving...' : 'Saved'}
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
            <button onClick={handleDelete} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete Task">
                <Trash2 className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            {/* Main Content (Left) */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-white dark:bg-slate-900">
                {/* Title */}
                <div className="space-y-1">
                    <input 
                        className="text-3xl font-bold text-slate-900 dark:text-white w-full border-none focus:ring-0 p-0 placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-transparent"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Task Title"
                    />
                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                       <span>In project</span>
                       <span className="font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{task.project?.name || 'General'}</span>
                    </div>
                </div>
                
                {/* Description */}
                <div className="space-y-2 group">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        Description
                    </label>
                    <div className="relative">
                        <textarea 
                            className="w-full min-h-[120px] p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary-500 focus:ring-0 resize-none transition-all text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 bg-slate-50/30 dark:bg-slate-800/30 focus:bg-white dark:focus:bg-slate-950 leading-relaxed"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Add more details to this task..."
                        />
                    </div>
                </div>

                {/* Checklist (Subtasks) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        Subtasks
                    </label>
                  </div>
                  <div className="space-y-2">
                    {checklist.map(item => (
                      <div key={item.id} className="flex items-start gap-3 group py-1">
                        <button 
                          onClick={() => toggleChecklistItem(item.id)}
                          className={`mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center transition-all duration-200 ${item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-green-500'}`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                        <div className="flex-1 relative">
                            <input 
                              className={`w-full bg-transparent border-none focus:ring-0 p-0 text-sm transition-all ${item.completed ? 'text-slate-400 dark:text-slate-600 line-through decoration-slate-300 dark:decoration-slate-700' : 'text-slate-900 dark:text-slate-200'}`}
                              value={item.text}
                              onChange={e => updateChecklistItem(item.id, e.target.value)}
                              placeholder="Subtask..."
                            />
                        </div>
                        <button onClick={() => removeChecklistItem(item.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={addChecklistItem} 
                      className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors px-1 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 w-full text-left mt-2"
                    >
                      <Plus className="h-4 w-4" /> Add subtask
                    </button>
                  </div>
                </div>

                {/* Attachments */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            Attachments
                        </label>
                        <label className="cursor-pointer text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:underline flex items-center gap-1 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded border border-primary-100 dark:border-primary-800">
                            <Paperclip className="h-3.5 w-3.5" /> Add file
                            <input type="file" className="hidden" onChange={handleFileUpload} />
                        </label>
                    </div>
                    
                    {attachments.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {attachments.map(att => (
                                <div key={att.id} className="flex items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 group hover:border-primary-200 dark:hover:border-primary-700 transition-colors shadow-sm">
                                    <div className="h-10 w-10 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 mr-3 shrink-0">
                                        {att.file_type.includes('image') ? <FileText className="h-5 w-5" /> : <File className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{att.file_name}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(att.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href={att.file_url} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
                                            <Download className="h-4 w-4" />
                                        </a>
                                        <button onClick={() => deleteAttachment(att.id)} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Comments Section */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-6">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      Discussion
                  </label>
                  
                  <div className="space-y-6">
                    {comments.map(comment => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold shrink-0 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
                          {comment.user?.full_name?.[0]}
                        </div>
                        <div className="flex-1 space-y-1">
                           <div className="flex items-baseline gap-2">
                             <span className="text-sm font-bold text-slate-900 dark:text-white">{comment.user?.full_name}</span>
                             <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(comment.created_at).toLocaleString()}</span>
                           </div>
                           <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                       {user?.full_name?.[0]}
                    </div>
                    <form onSubmit={postComment} className="flex-1 relative">
                       <div className="relative rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all">
                           <textarea 
                             className="w-full border-none bg-transparent rounded-xl px-4 py-3 text-sm focus:ring-0 min-h-[50px] resize-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                             placeholder="Ask a question or post an update..."
                             value={newComment}
                             onChange={e => setNewComment(e.target.value)}
                             onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    postComment(e);
                                }
                             }}
                           />
                           <div className="flex justify-between items-center px-2 pb-2">
                              <div className="text-xs text-slate-400 dark:text-slate-500 px-2">Press Enter to post</div>
                              <Button 
                                type="submit" 
                                size="sm"
                                disabled={!newComment.trim()}
                                className="h-8"
                              >
                                Comment
                              </Button>
                           </div>
                       </div>
                    </form>
                  </div>
                </div>
            </div>

            {/* Sidebar (Right) */}
            <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-6 space-y-6 overflow-y-auto">
                
                {/* Assignee Multi-Select */}
                <div className="space-y-2" ref={assigneeDropdownRef}>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assignees</label>
                    <div className="relative group">
                        <div 
                            className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary-300 dark:hover:border-primary-600 transition-colors cursor-pointer min-h-[42px]"
                            onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                        >
                            <div className="flex flex-wrap gap-1.5">
                                {assignedToIds.length === 0 ? (
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <User className="h-3.5 w-3.5" />
                                        <span className="text-sm">Unassigned</span>
                                    </div>
                                ) : (
                                    assignedMembers.map(m => (
                                        <div key={m.user_id} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700" title={m.user?.full_name}>
                                            <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600 text-[9px] flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                                                {m.user?.full_name?.[0]}
                                            </div>
                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{m.user?.full_name?.split(' ')[0]}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                        </div>

                        {isAssigneeDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto p-1 custom-scrollbar">
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
                </div>

                {/* Due Date Selector with SmartDatePicker */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Due Date</label>
                    <SmartDatePicker 
                       value={dueDate}
                       onChange={(date) => setDueDate(date)}
                       placeholder="Set due date"
                       className="w-full"
                       variant="input"
                       align="right"
                    />
                </div>

                {/* Priority Selector */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority</label>
                    <div className="relative group">
                        <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary-300 dark:hover:border-primary-600 transition-colors cursor-pointer">
                            <Flag className={`h-4 w-4 ml-1 ${priority === 'high' ? 'text-red-500' : priority === 'medium' ? 'text-blue-500' : 'text-slate-400'}`} />
                            <span className="text-sm font-medium text-slate-900 dark:text-white flex-1 capitalize ml-1">{priority}</span>
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                        </div>
                        <select 
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            value={priority}
                            onChange={e => setPriority(e.target.value as TaskPriority)}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>
                
                {/* Status Selector */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</label>
                    <div className="relative group">
                        <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary-300 dark:hover:border-primary-600 transition-colors cursor-pointer">
                            <div className={`h-3 w-3 ml-1.5 rounded-full ${
                                status === 'done' ? 'bg-green-500' : 
                                status === 'in_progress' ? 'bg-blue-500' :
                                status === 'review' ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'
                            }`} />
                            <span className="text-sm font-medium text-slate-900 dark:text-white flex-1 capitalize ml-1.5">{status.replace('_', ' ')}</span>
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                        </div>
                        <select 
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            value={status}
                            onChange={e => setStatus(e.target.value as TaskStatus)}
                        >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>
                        </select>
                    </div>
                </div>

                {/* Dependencies Section */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dependencies</label>
                    
                    {/* Existing Dependencies List */}
                    {dependencies.length > 0 && (
                        <div className="space-y-1 mb-2">
                            {dependencies.map(depId => {
                                const depTask = projectTasks.find(t => t.id === depId);
                                if (!depTask) return null;
                                return (
                                    <div key={depId} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${depTask.status === 'done' ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                            <span className={`text-xs font-medium truncate ${depTask.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {depTask.title}
                                            </span>
                                        </div>
                                        <button onClick={() => removeDependency(depId)} className="text-slate-400 hover:text-red-500 transition-colors">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Add Dependency Select */}
                    <div className="relative group">
                        <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary-300 dark:hover:border-primary-600 transition-colors cursor-pointer">
                            <Link className="h-3.5 w-3.5 ml-1 text-slate-400" />
                            <span className="text-sm font-medium text-slate-900 dark:text-white flex-1">Add blocking task...</span>
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                        </div>
                        <select 
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            value=""
                            onChange={e => addDependency(e.target.value)}
                        >
                            <option value="">Select task...</option>
                            {projectTasks
                                .filter(t => t.id !== task.id && !dependencies.includes(t.id))
                                .map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.title} ({t.status.replace('_', ' ')})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Metadata */}
                <div className="pt-6 mt-auto border-t border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-400 dark:text-slate-500 flex flex-col gap-2">
                    <div className="flex justify-between">
                        <span>Created</span>
                        <span>{new Date(task.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>ID</span>
                        <span className="font-mono">{task.id.split('-')[1]}</span>
                    </div>
                  </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
