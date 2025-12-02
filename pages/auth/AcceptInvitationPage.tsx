
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Building2, UserPlus, AlertCircle, Clock, FolderOpen } from 'lucide-react';
import { organizationService } from '../../services/organizationService';
import { useAuth } from '../../context/AuthContext';
import { Invitation } from '../../types';
import { Button } from '../../components/ui/Button';

export const AcceptInvitationPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { user, isAuthenticated } = useAuth();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (token) {
      loadInvitation();
    } else {
      setError('Invalid invitation link');
      setIsLoading(false);
    }
  }, [token]);

  const loadInvitation = async () => {
    if (!token) return;

    try {
      const inv = await organizationService.getInvitationByToken(token);
      if (inv) {
        setInvitation(inv);
      } else {
        setError('This invitation is invalid, expired, or has already been used.');
      }
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('Failed to load invitation details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) return;

    setIsAccepting(true);
    try {
      await organizationService.acceptInvitationByToken(invitation.token, user.id);
      // Redirect to dashboard with success message
      navigate('/', { state: { invitationAccepted: true, orgName: invitation.organization?.name } });
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation');
      setIsAccepting(false);
    }
  };

  const handleLoginToAccept = () => {
    // Redirect to login with invite token preserved
    navigate(`/login?invite=${token}`);
  };

  const handleRegisterToAccept = () => {
    // Redirect to register with invite token and prefilled email
    navigate(`/register?invite=${token}&email=${encodeURIComponent(invitation?.email || '')}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Invalid Invitation
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {error}
          </p>
          <Button onClick={() => navigate('/login')} variant="outline" className="w-full">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Invitation found - show details
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 max-w-md w-full border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            You're Invited!
          </h1>
          {invitation?.inviter && (
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {invitation.inviter.full_name}
              </span>{' '}
              has invited you to join
            </p>
          )}
        </div>

        {/* Organization Info */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {invitation?.organization?.name}
              </h2>
              <p className="text-sm text-primary-600 dark:text-primary-400">
                as {invitation?.role?.display_name}
              </p>
            </div>
          </div>
        </div>

        {/* Project Info (if applicable) */}
        {invitation?.project && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Also added to project:</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {invitation.project.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Personal Message */}
        {invitation?.personal_message && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-4 border border-amber-100 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200 italic">
              "{invitation.personal_message}"
            </p>
          </div>
        )}

        {/* Expiry Notice */}
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6 justify-center">
          <Clock className="h-4 w-4" />
          <span>
            Expires on {new Date(invitation?.expires_at || '').toLocaleDateString()}
          </span>
        </div>

        {/* Action Buttons */}
        {isAuthenticated && user ? (
          // User is logged in - can accept directly
          <div className="space-y-3">
            {user.email === invitation?.email ? (
              <Button
                onClick={handleAcceptInvitation}
                isLoading={isAccepting}
                className="w-full"
                size="lg"
              >
                Accept Invitation
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
                  This invitation was sent to <strong>{invitation?.email}</strong>,
                  but you're logged in as <strong>{user.email}</strong>.
                </p>
                <Button
                  onClick={handleAcceptInvitation}
                  isLoading={isAccepting}
                  className="w-full"
                  size="lg"
                >
                  Accept Anyway
                </Button>
              </div>
            )}
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        ) : (
          // User not logged in - show login/register options
          <div className="space-y-3">
            <Button
              onClick={handleRegisterToAccept}
              className="w-full"
              size="lg"
            >
              Create Account & Accept
            </Button>
            <Button
              onClick={handleLoginToAccept}
              variant="outline"
              className="w-full"
            >
              I already have an account
            </Button>
          </div>
        )}

        {/* Email hint */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
          Invitation for: {invitation?.email}
        </p>
      </div>
    </div>
  );
};
