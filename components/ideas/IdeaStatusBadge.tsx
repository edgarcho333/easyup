
import React from 'react';
import { IdeaStatus } from '../../types';

const statusConfig: Record<IdeaStatus, { color: string; label: string }> = {
  draft: { color: 'bg-slate-100 text-slate-600 border border-slate-200', label: 'Draft' },
  pending_approval: { color: 'bg-amber-50 text-amber-700 border border-amber-100', label: 'Concept Review' },
  in_production: { color: 'bg-blue-50 text-blue-700 border border-blue-100', label: 'In Production' },
  pending_final_review: { color: 'bg-purple-50 text-purple-700 border border-purple-100', label: 'Visual Review' },
  scheduled: { color: 'bg-emerald-50 text-emerald-700 border border-emerald-100', label: 'Scheduled' },
  published: { color: 'bg-slate-800 text-white border border-slate-700', label: 'Published' },
  changes_requested: { color: 'bg-orange-50 text-orange-700 border border-orange-100', label: 'Changes Requested' },
  rejected: { color: 'bg-red-50 text-red-700 border border-red-100', label: 'Rejected' },
};

export const IdeaStatusBadge: React.FC<{ status: IdeaStatus }> = ({ status }) => {
  const config = statusConfig[status] || statusConfig.draft;
  
  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${config.color}`}>
      {config.label}
    </span>
  );
};
