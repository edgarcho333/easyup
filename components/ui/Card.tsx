
import React, { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

export const CardTitle: React.FC<CardProps> = ({ children, className = '' }) => (
  <h3 className={`font-semibold leading-none tracking-tight text-lg ${className}`}>{children}</h3>
);

export const CardDescription: React.FC<CardProps> = ({ children, className = '' }) => (
  <p className={`text-sm text-slate-500 ${className}`}>{children}</p>
);

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

export const CardFooter: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>
);