
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { CheckCircle2, MessageSquare } from 'lucide-react';

interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment?: string) => void;
  action: 'approve' | 'changes';
  count: number;
  isLoading: boolean;
}

export const BulkActionModal: React.FC<BulkActionModalProps> = ({ isOpen, onClose, onConfirm, action, count, isLoading }) => {
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const isApprove = action === 'approve';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className={`flex items-center justify-center w-14 h-14 mx-auto rounded-full mb-5 ${isApprove ? 'bg-green-100' : 'bg-orange-100'}`}>
            {isApprove ? <CheckCircle2 className="h-7 w-7 text-green-600" /> : <MessageSquare className="h-7 w-7 text-orange-600" />}
          </div>
          
          <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
            {isApprove ? `Approve ${count} Items` : `Request Changes`}
          </h3>
          <p className="text-center text-slate-500 mb-6 text-sm leading-relaxed px-4">
            {isApprove 
              ? `Are you sure you want to approve ${count} selected items? They will move to the next stage.` 
              : `Provide feedback for the ${count} selected items. This comment will be applied to all of them.`}
          </p>

          {!isApprove && (
            <textarea
              className="w-full rounded-md border border-slate-300 p-3 text-sm focus:ring-2 focus:ring-primary-500 min-h-[100px] mb-4"
              placeholder="Enter feedback..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              autoFocus
            />
          )}

          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="flex-1" disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={() => onConfirm(comment)} 
              isLoading={isLoading} 
              className={`flex-1 shadow-md ${isApprove ? 'bg-green-600 hover:bg-green-700 shadow-green-100' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-100'}`}
              disabled={!isApprove && !comment.trim()}
            >
              {isApprove ? 'Confirm' : 'Submit'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
