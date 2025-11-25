
import React, { useState, useEffect } from 'react';
import { Workflow, WorkflowTriggerType, WorkflowActionType, ProjectMember } from '../../types';
import { workflowService } from '../../services/workflowService';
import { projectService } from '../../services/projectService';
import { Button } from '../ui/Button';
import { X, Zap, ArrowDown, User, CheckCircle2, Flag, MessageSquare, ChevronRight, Check, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface WorkflowBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
}

export const WorkflowBuilderModal: React.FC<WorkflowBuilderModalProps> = ({ isOpen, onClose, onSuccess, projectId }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<WorkflowTriggerType | null>(null);
  const [triggerValue, setTriggerValue] = useState('');
  const [actionType, setActionType] = useState<WorkflowActionType | null>(null);
  const [actionValue, setActionValue] = useState('');
  
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchMembers();
    }
  }, [isOpen]);

  const resetForm = () => {
    setStep(1);
    setName('');
    setTriggerType(null);
    setTriggerValue('');
    setActionType(null);
    setActionValue('');
  };

  const fetchMembers = async () => {
    try {
      const project = await projectService.getProject(projectId);
      if (project.members) setMembers(project.members);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!user || !triggerType || !actionType) return;
    setIsLoading(true);
    try {
      await workflowService.createWorkflow({
        project_id: projectId,
        name: name || `Auto-rule ${Date.now()}`,
        trigger_type: triggerType,
        trigger_value: triggerValue,
        action_type: actionType,
        action_value: actionValue,
        is_enabled: true,
        created_by: user.id
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const triggers = [
    { id: 'status_change', label: 'Status Changed', icon: CheckCircle2, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400', needsValue: true, valueLabel: 'To Status', options: [{val: 'done', lbl: 'Done'}, {val: 'review', lbl: 'Review'}, {val: 'in_progress', lbl: 'In Progress'}] },
    { id: 'priority_change', label: 'Priority Changed', icon: Flag, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', needsValue: true, valueLabel: 'To Priority', options: [{val: 'high', lbl: 'High'}, {val: 'medium', lbl: 'Medium'}, {val: 'low', lbl: 'Low'}] },
    { id: 'task_created', label: 'Task Created', icon: Plus, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', needsValue: false },
  ];

  const actions = [
    { id: 'assign_user', label: 'Assign Owner', icon: User, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', needsValue: true, valueLabel: 'Assign To', type: 'user_select' },
    { id: 'change_status', label: 'Move to Column', icon: ArrowDown, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', needsValue: true, valueLabel: 'Move To', type: 'status_select' },
    { id: 'post_comment', label: 'Post Comment', icon: MessageSquare, color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300', needsValue: true, valueLabel: 'Message', type: 'text' },
  ];

  const currentTrigger = triggers.find(t => t.id === triggerType);
  const currentAction = actions.find(a => a.id === actionType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500 fill-amber-500" /> Automation Rule
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Create custom workflows for your team.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"><X className="h-5 w-5" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-8">
          
          {/* Step 1: Trigger */}
          <div className="mb-8 relative">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-sm font-bold">1</div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">When this happens...</h4>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-11">
                {triggers.map(t => {
                   const Icon = t.icon;
                   const isSelected = triggerType === t.id;
                   return (
                     <div 
                       key={t.id}
                       onClick={() => { setTriggerType(t.id as any); setTriggerValue(''); }}
                       className={`p-4 rounded-xl border-2 cursor-pointer transition-all bg-white dark:bg-slate-800 hover:shadow-md flex flex-col items-center justify-center gap-3 h-32 text-center
                         ${isSelected ? 'border-primary-500 ring-1 ring-primary-500 dark:border-primary-500' : 'border-transparent dark:border-slate-700 shadow-sm hover:border-primary-200 dark:hover:border-primary-700'}
                       `}
                     >
                        <div className={`p-2 rounded-full ${t.color}`}>
                           <Icon className="h-6 w-6" />
                        </div>
                        <span className={`text-sm font-medium ${isSelected ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300'}`}>{t.label}</span>
                     </div>
                   );
                })}
             </div>

             {/* Trigger Settings */}
             {currentTrigger?.needsValue && (
                <div className="pl-11 mt-4 animate-in fade-in slide-in-from-top-2">
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{currentTrigger.valueLabel}</label>
                   <select 
                     className="w-full max-w-xs rounded-lg border-slate-200 dark:border-slate-700 text-sm p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                     value={triggerValue}
                     onChange={e => setTriggerValue(e.target.value)}
                   >
                      <option value="">Select...</option>
                      {currentTrigger.options?.map(opt => (
                        <option key={opt.val} value={opt.val}>{opt.lbl}</option>
                      ))}
                   </select>
                </div>
             )}
          </div>

          {/* Connector */}
          <div className="flex justify-center mb-8 text-slate-300 dark:text-slate-600">
             <ArrowDown className="h-8 w-8" />
          </div>

          {/* Step 2: Action */}
          <div className="mb-8">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-sm font-bold">2</div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Then do this...</h4>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-11">
                {actions.map(a => {
                   const Icon = a.icon;
                   const isSelected = actionType === a.id;
                   return (
                     <div 
                       key={a.id}
                       onClick={() => { setActionType(a.id as any); setActionValue(''); }}
                       className={`p-4 rounded-xl border-2 cursor-pointer transition-all bg-white dark:bg-slate-800 hover:shadow-md flex flex-col items-center justify-center gap-3 h-32 text-center
                         ${isSelected ? 'border-primary-500 ring-1 ring-primary-500 dark:border-primary-500' : 'border-transparent dark:border-slate-700 shadow-sm hover:border-primary-200 dark:hover:border-primary-700'}
                       `}
                     >
                        <div className={`p-2 rounded-full ${a.color}`}>
                           <Icon className="h-6 w-6" />
                        </div>
                        <span className={`text-sm font-medium ${isSelected ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300'}`}>{a.label}</span>
                     </div>
                   );
                })}
             </div>

             {/* Action Settings */}
             {currentAction && (
                <div className="pl-11 mt-4 animate-in fade-in slide-in-from-top-2">
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{currentAction.valueLabel}</label>
                   
                   {currentAction.type === 'user_select' && (
                      <select 
                        className="w-full max-w-xs rounded-lg border-slate-200 dark:border-slate-700 text-sm p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        value={actionValue}
                        onChange={e => setActionValue(e.target.value)}
                      >
                         <option value="">Select Member...</option>
                         {members.map(m => (
                           <option key={m.user_id} value={m.user_id}>{m.user?.full_name}</option>
                         ))}
                      </select>
                   )}

                   {currentAction.type === 'status_select' && (
                      <select 
                        className="w-full max-w-xs rounded-lg border-slate-200 dark:border-slate-700 text-sm p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        value={actionValue}
                        onChange={e => setActionValue(e.target.value)}
                      >
                         <option value="">Select Column...</option>
                         <option value="todo">To Do</option>
                         <option value="in_progress">In Progress</option>
                         <option value="review">Review</option>
                         <option value="done">Done</option>
                      </select>
                   )}

                   {currentAction.type === 'text' && (
                      <input 
                        className="w-full max-w-sm rounded-lg border-slate-200 dark:border-slate-700 text-sm p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        placeholder="Type message..."
                        value={actionValue}
                        onChange={e => setActionValue(e.target.value)}
                      />
                   )}
                </div>
             )}
          </div>

          {/* Step 3: Name */}
          <div className="pl-11">
             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Rule Name (Optional)</label>
             <input 
               className="w-full max-w-sm rounded-lg border-slate-200 dark:border-slate-700 text-sm p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
               placeholder="e.g. Auto-Assign High Priority Tasks"
               value={name}
               onChange={e => setName(e.target.value)}
             />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-white dark:bg-slate-900">
           <Button variant="ghost" onClick={onClose} className="dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800">Cancel</Button>
           <Button 
             onClick={handleCreate} 
             isLoading={isLoading}
             disabled={!triggerType || !actionType || (currentTrigger?.needsValue && !triggerValue) || (currentAction?.needsValue && !actionValue)}
           >
             <Check className="h-4 w-4 mr-2" /> Create Rule
           </Button>
        </div>
      </div>
    </div>
  );
};
