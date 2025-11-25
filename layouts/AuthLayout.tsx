
import React, { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

interface AuthLayoutProps {
  children?: ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-primary-600 p-3 rounded-xl shadow-lg mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            EASYUP
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Social Media Campaign Management Platform
          </p>
        </div>
        {children}
      </div>
      <div className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
        &copy; 2024 EASYUP Inc. All rights reserved.
      </div>
    </div>
  );
};
