
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center w-14 h-14 mx-auto bg-green-100 rounded-full mb-5">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          
          <h3 className="text-xl font-bold text-center text-slate-900 mb-2">{title}</h3>
          <p className="text-center text-slate-500 mb-6 text-sm leading-relaxed px-4">{description}</p>

          <div className="bg-slate-50 rounded-lg p-4 mb-6 flex items-center justify-between text-sm border border-slate-100 shadow-inner">
             <span className="font-medium text-slate-500">{currentStageLabel}</span>
             <ArrowRight className="h-4 w-4 text-slate-300" />
             <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">{nextStageLabel}</span>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="flex-1" disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={onConfirm} isLoading={isLoading} className="flex-1 bg-green-600 hover:bg-green-700 shadow-md shadow-green-100">
              Confirm Approval
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
