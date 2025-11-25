
import React from 'react';
import { XCircle } from 'lucide-react';

export const GuestApprovalPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 transition-colors">
          <XCircle className="h-8 w-8 text-slate-400 dark:text-slate-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Feature Unavailable</h2>
        <p className="text-slate-600 dark:text-slate-400">Guest approval links have been disabled for this project.</p>
      </div>
    </div>
  );
};
