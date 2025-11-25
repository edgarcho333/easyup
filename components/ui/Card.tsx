import React, { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-slate-50 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

export const CardTitle: React.FC<CardProps> = ({ children, className = '' }) => (
  <h3 className={`font-semibold leading-none tracking-tight text-lg text-slate-900 dark:text-slate-50 ${className}`}>{children}</h3>
);

export const CardDescription: React.FC<CardProps> = ({ children, className = '' }) => (
  <p className={`text-sm text-slate-500 dark:text-slate-400 ${className}`}>{children}</p>
);

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

export const CardFooter: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>
);