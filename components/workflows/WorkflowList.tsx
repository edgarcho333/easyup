
import React, { useState, useEffect } from 'react';
import { workflowService } from '../../services/workflowService';
import { Workflow } from '../../types';
import { Loader2, Zap, Plus, Trash2, Power, ArrowRight, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { WorkflowBuilderModal } from './WorkflowBuilderModal';

interface WorkflowListProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const WorkflowList: React.FC<WorkflowListProps> = ({ isOpen, onClose, projectId }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchWorkflows();
    }
  }, [isOpen, projectId]);

  const fetchWorkflows = async () => {
    setIsLoading(true);
    try {
      const data = await workflowService.getProjectWorkflows(projectId);
      setWorkflows(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    // Optimistic update
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, is_enabled: !currentState } : w));
    try {
      await workflowService.toggleWorkflow(id, !currentState);
    } catch (err) {
      fetchWorkflows(); // Revert on error
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this automation rule?")) return;
    setWorkflows(prev => prev.filter(w => w.id !== id));
    try {
      await workflowService.deleteWorkflow(id);
    } catch (err) {
      fetchWorkflows();
    }
  };

  const getSummary = (w: Workflow) => {
    const triggerMap: any = { 'status_change': 'Status is', 'priority_change': 'Priority is', 'task_created': 'Task Created' };
    const actionMap: any = { 'assign_user': 'Assign to', 'change_status': 'Move to', 'post_comment': 'Comment' };
    
    const tVal = w.trigger_value ? `"${w.trigger_value.replace('_', ' ')}"` : '';
    const aVal = w.action_type === 'post_comment' ? 'message' : w.action_value ? `"${w.action_value}"` : '';

    return (
      <div className="flex items-center gap-2 text-xs flex-wrap mt-1 text-slate-600">
         <span className="font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{triggerMap[w.trigger_type]} {tVal}</span>
         <ArrowRight className="h-3 w-3 text-slate-400" />
         <span className="font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">{actionMap[w.action_type]} {aVal}</span>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-[400px] bg-slate-50 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-5 bg-white border-b border-slate-100 flex justify-between items-center">
           <div>
             <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
               <Zap className="h-5 w-5 text-amber-500 fill-amber-500" /> Automations
             </h3>
             <p className="text-xs text-slate-500 mt-1">Manage rules to save time.</p>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100">
             <X className="h-5 w-5" />
           </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
           {isLoading ? (
             <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary-600" /></div>
           ) : workflows.length === 0 ? (
             <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Zap className="h-6 w-6 text-slate-300" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">No rules yet</h4>
                <p className="text-xs text-slate-500 mt-1 mb-4">Create your first workflow to automate busy work.</p>
                <Button size="sm" onClick={() => setIsBuilderOpen(true)}>Create Rule</Button>
             </div>
           ) : (
             workflows.map(w => (
               <div key={w.id} className={`bg-white p-4 rounded-xl border shadow-sm transition-all group relative ${w.is_enabled ? 'border-slate-200 hover:border-primary-200' : 'border-slate-100 opacity-60'}`}>
                  <div className="flex justify-between items-start mb-2">
                     <h4 className="font-bold text-slate-800 text-sm">{w.name}</h4>
                     <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleToggle(w.id, w.is_enabled)}
                          className={`w-8 h-4 rounded-full transition-colors relative ${w.is_enabled ? 'bg-green-500' : 'bg-slate-300'}`}
                        >
                           <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${w.is_enabled ? 'left-4.5 translate-x-full' : 'left-0.5'}`} />
                        </button>
                     </div>
                  </div>
                  
                  {getSummary(w)}

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                       onClick={() => handleDelete(w.id)}
                       className="p-1.5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md shadow-sm border border-slate-100"
                     >
                        <Trash2 className="h-3.5 w-3.5" />
                     </button>
                  </div>
               </div>
             ))
           )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-slate-100">
           <Button onClick={() => setIsBuilderOpen(true)} className="w-full shadow-lg shadow-primary-200">
              <Plus className="h-4 w-4 mr-2" /> Add New Rule
           </Button>
        </div>

      </div>

      <WorkflowBuilderModal 
        isOpen={isBuilderOpen} 
        onClose={() => setIsBuilderOpen(false)}
        onSuccess={() => { fetchWorkflows(); }}
        projectId={projectId}
      />
    </>
  );
};
