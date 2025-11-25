
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const AcceptInvitationPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard as invitations are handled there or auto-accepted
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Redirecting to dashboard...</p>
      </div>
    </div>
  );
};
