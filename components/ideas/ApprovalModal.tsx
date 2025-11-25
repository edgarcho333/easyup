
import React from 'react';
import { Idea } from '../../types';
import { Button } from '../ui/Button';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  idea: Idea | null;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({ isOpen, onClose, onConfirm, isLoading, idea }) => {
  if (!isOpen || !idea) return null;

  const isFinal = idea.status === 'pending_final_review';
  const title = isFinal ? 'Final Approval' : 'Approve Concept';
  const description = isFinal 
    ? 'This content is ready for publishing. Approving will schedule it on the calendar.'
    : 'This concept is ready for production. The design team will be notified to start creating assets.';
  
  const currentStageLabel = idea.status === 'pending_final_review' ? 'Visual Review' : 'Concept Review';
  const nextStageLabel = isFinal ? 'Scheduled' : 'In Production';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-6">
          <div className="flex items-center justify-center w-14 h-14 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full mb-5">
            <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
          </div>
          
          <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">{title}</h3>
          <p className="text-center text-slate-500 dark:text-slate-400 mb-6 text-sm leading-relaxed px-4">{description}</p>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-6 flex items-center justify-between text-sm border border-slate-100 dark:border-slate-700 shadow-inner">
             <span className="font-medium text-slate-500 dark:text-slate-400">{currentStageLabel}</span>
             <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-500" />
             <span className="font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded border border-green-100 dark:border-green-900/50">{nextStageLabel}</span>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="flex-1 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800" disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={onConfirm} isLoading={isLoading} className="flex-1 bg-green-600 hover:bg-green-700 shadow-md shadow-green-100 dark:shadow-none">
              Confirm Approval
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
