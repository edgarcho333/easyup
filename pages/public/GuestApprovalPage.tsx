
import React from 'react';
import { XCircle } from 'lucide-react';

export const GuestApprovalPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <XCircle className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Feature Unavailable</h2>
        <p className="text-slate-600">Guest approval links have been disabled for this project.</p>
      </div>
    </div>
  );
};
