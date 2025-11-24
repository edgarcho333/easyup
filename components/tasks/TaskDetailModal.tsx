
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Task, TaskPriority, TaskStatus, ProjectMember, TaskComment, TaskChecklistItem, TaskAttachment } from '../../types';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { Button } from '../ui/Button';
import { X, Calendar, Flag, User, CheckCircle2, Trash2, Plus, CheckSquare, Send, Paperclip, FileText, Download, Clock, File, ChevronDown } from 'lucide-react';
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
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<TaskChecklistItem[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Determine active project ID either from prop or task
  const activeProjectId = projectId || task?.project_id;

  useEffect(() => {
    if (isOpen && task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setAssignedTo(task.assigned_to || '');
      setDueDate(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : null);
      setChecklist(task.checklist || []);
      
      if (activeProjectId) {
        fetchMembers(activeProjectId);
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

  const handleAutoSave = async () => {
    if (!task) return;
    setIsSaving(true);
    try {
      await taskService.updateTask(task.id, {
        title,
        description,
        status,
        priority,
        assigned_to: assignedTo || null,
        due_date: dueDate || undefined, 
        checklist
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
  }, [title, description, status, priority, assignedTo, dueDate, checklist]);

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

  const assignedMember = members.find(m => m.user_id === assignedTo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex gap-3">
             <Button 
                variant="outline"
                className={`
                  transition-all font-semibold shadow-sm border-2
                  ${status === 'done' 
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                    : 'bg-white text-slate-700 border-slate-200 hover:border-green-500 hover:text-green-700 hover:bg-green-50'
                  }
                `} 
                onClick={markComplete}
             >
                <CheckCircle2 className={`h-4 w-4 mr-2 ${status === 'done' ? 'fill-green-600 text-white' : 'text-slate-400 group-hover:text-green-600'}`} /> 
                {status === 'done' ? 'Completed' : 'Mark Complete'}
             </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
               {isSaving && <Clock className="h-3 w-3 animate-spin" />} 
               {isSaving ? 'Saving...' : 'Saved'}
            </div>
            <div className="h-4 w-px bg-slate-200"></div>
            <button onClick={handleDelete} className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50" title="Delete Task">
                <Trash2 className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-100">
                <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            {/* Main Content (Left) */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                {/* Title */}
                <div className="space-y-1">
                    <input 
                        className="text-3xl font-bold text-slate-900 w-full border-none focus:ring-0 p-0 placeholder:text-slate-300 bg-transparent"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Task Title"
                    />
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                       <span>In project</span>
                       <span className="font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{task.project?.name || 'General'}</span>
                    </div>
                </div>
                
                {/* Description */}
                <div className="space-y-2 group">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        Description
                    </label>
                    <div className="relative">
                        <textarea 
                            className="w-full min-h-[120px] p-4 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:ring-0 resize-none transition-all text-slate-700 placeholder:text-slate-400 bg-slate-50/30 focus:bg-white leading-relaxed"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Add more details to this task..."
                        />
                    </div>
                </div>

                {/* Checklist (Subtasks) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        Subtasks
                    </label>
                  </div>
                  <div className="space-y-2">
                    {checklist.map(item => (
                      <div key={item.id} className="flex items-start gap-3 group py-1">
                        <button 
                          onClick={() => toggleChecklistItem(item.id)}
                          className={`mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center transition-all duration-200 ${item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 text-transparent hover:border-green-500'}`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                        <div className="flex-1 relative">
                            <input 
                              className={`w-full bg-transparent border-none focus:ring-0 p-0 text-sm transition-all ${item.completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-900'}`}
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
                      className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 transition-colors px-1 py-1 rounded hover:bg-slate-50 w-full text-left mt-2"
                    >
                      <Plus className="h-4 w-4" /> Add subtask
                    </button>
                  </div>
                </div>

                {/* Attachments */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            Attachments
                        </label>
                        <label className="cursor-pointer text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1 bg-primary-50 px-2 py-1 rounded border border-primary-100">
                            <Paperclip className="h-3.5 w-3.5" /> Add file
                            <input type="file" className="hidden" onChange={handleFileUpload} />
                        </label>
                    </div>
                    
                    {attachments.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {attachments.map(att => (
                                <div key={att.id} className="flex items-center p-3 border border-slate-200 rounded-lg bg-white group hover:border-primary-200 transition-colors shadow-sm">
                                    <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center text-slate-500 mr-3 shrink-0">
                                        {att.file_type.includes('image') ? <FileText className="h-5 w-5" /> : <File className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">{att.file_name}</p>
                                        <p className="text-[10px] text-slate-500">{new Date(att.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href={att.file_url} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-primary-600 rounded hover:bg-slate-100">
                                            <Download className="h-4 w-4" />
                                        </a>
                                        <button onClick={() => deleteAttachment(att.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Comments Section */}
                <div className="pt-6 border-t border-slate-100 space-y-6">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      Discussion
                  </label>
                  
                  <div className="space-y-6">
                    {comments.map(comment => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold shrink-0 text-slate-600 border border-slate-300">
                          {comment.user?.full_name?.[0]}
                        </div>
                        <div className="flex-1 space-y-1">
                           <div className="flex items-baseline gap-2">
                             <span className="text-sm font-bold text-slate-900">{comment.user?.full_name}</span>
                             <span className="text-xs text-slate-400">{new Date(comment.created_at).toLocaleString()}</span>
                           </div>
                           <p className="text-sm text-slate-700 leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                       {user?.full_name?.[0]}
                    </div>
                    <form onSubmit={postComment} className="flex-1 relative">
                       <div className="relative rounded-xl shadow-sm border border-slate-200 bg-white focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all">
                           <textarea 
                             className="w-full border-none bg-transparent rounded-xl px-4 py-3 text-sm focus:ring-0 min-h-[50px] resize-none"
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
                              <div className="text-xs text-slate-400 px-2">Press Enter to post</div>
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
            <div className="w-full md:w-80 bg-slate-50 border-l border-slate-200 p-6 space-y-6 overflow-y-auto">
                
                {/* Assignee Selector */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assignee</label>
                    <div className="relative group">
                        <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-primary-300 transition-colors cursor-pointer">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${assignedTo ? 'bg-primary-600' : 'bg-slate-300'}`}>
                                {assignedMember ? assignedMember.user?.full_name?.[0] : <User className="h-3 w-3" />}
                            </div>
                            <span className="text-sm font-medium text-slate-900 flex-1 truncate">
                              {assignedMember ? assignedMember.user?.full_name : 'Unassigned'}
                            </span>
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                        </div>
                        <select 
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            value={assignedTo}
                            onChange={e => setAssignedTo(e.target.value)}
                        >
                            <option value="">Unassigned</option>
                            {members.map(m => (
                                <option key={m.user_id} value={m.user_id}>{m.user?.full_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Due Date Selector with SmartDatePicker */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</label>
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
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</label>
                    <div className="relative group">
                        <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-primary-300 transition-colors cursor-pointer">
                            <Flag className={`h-4 w-4 ml-1 ${priority === 'high' ? 'text-red-500' : priority === 'medium' ? 'text-blue-500' : 'text-slate-400'}`} />
                            <span className="text-sm font-medium text-slate-900 flex-1 capitalize ml-1">{priority}</span>
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
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                    <div className="relative group">
                        <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-primary-300 transition-colors cursor-pointer">
                            <div className={`h-3 w-3 ml-1.5 rounded-full ${
                                status === 'done' ? 'bg-green-500' : 
                                status === 'in_progress' ? 'bg-blue-500' :
                                status === 'review' ? 'bg-orange-500' : 'bg-slate-300'
                            }`} />
                            <span className="text-sm font-medium text-slate-900 flex-1 capitalize ml-1.5">{status.replace('_', ' ')}</span>
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

                {/* Metadata */}
                <div className="pt-6 mt-auto border-t border-slate-200">
                  <div className="text-xs text-slate-400 flex flex-col gap-2">
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
