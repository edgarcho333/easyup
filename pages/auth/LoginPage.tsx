
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { organizationService } from '../../services/organizationService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AlertCircle, Building2, LogIn } from 'lucide-react';
import { Invitation } from '../../types';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Invitation handling
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoadingInvite, setIsLoadingInvite] = useState(!!inviteToken);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Load invitation if token present
  useEffect(() => {
    if (inviteToken) {
      loadInvitation();
    }
  }, [inviteToken]);

  const loadInvitation = async () => {
    if (!inviteToken) return;

    try {
      const inv = await organizationService.getInvitationByToken(inviteToken);
      if (inv) {
        setInvitation(inv);
        if (inv.email) {
          setEmail(inv.email);
        }
      }
    } catch (err) {
      console.error('Error loading invitation:', err);
    } finally {
      setIsLoadingInvite(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const userId = await login(email, password);

      // If there's an invitation, accept it after login
      if (invitation && inviteToken && userId) {
        try {
          await organizationService.acceptInvitationByToken(inviteToken, userId);
          navigate('/', { state: { invitationAccepted: true, orgName: invitation.organization?.name } });
        } catch (invErr) {
          // Login succeeded but invitation acceptance failed
          // User is still logged in, just redirect to dashboard
          console.error('Failed to accept invitation:', invErr);
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking invitation
  if (isLoadingInvite) {
    return (
      <Card className="w-full shadow-xl border-0 dark:bg-slate-900 dark:border-slate-800">
        <CardContent className="py-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading invitation...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-xl border-0 dark:bg-slate-900 dark:border-slate-800">
      <CardHeader className="space-y-1">
        {invitation ? (
          // Invitation mode header
          <>
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <LogIn className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center dark:text-white">Sign in to Join</CardTitle>
            <CardDescription className="text-center dark:text-slate-400">
              Log in to accept your invitation
            </CardDescription>
          </>
        ) : (
          // Normal login header
          <>
            <CardTitle className="text-2xl text-center dark:text-white">Welcome back</CardTitle>
            <CardDescription className="text-center dark:text-slate-400">
              Enter your email to sign in to your account
            </CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent>
        {/* Invitation Info Banner */}
        {invitation && (
          <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <div className="text-sm">
                <p className="font-medium text-primary-700 dark:text-primary-300">
                  Joining: {invitation.organization?.name}
                </p>
                <p className="text-primary-600 dark:text-primary-400">
                  Role: {invitation.role?.display_name}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center space-x-2 text-sm text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
          />
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
            />
          </div>
          <Button type="submit" className="w-full" isLoading={isLoading}>
            {invitation ? 'Sign in & Join' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-slate-600 dark:text-slate-400">
        Don't have an account?{' '}
        <Link
          to={invitation ? `/register?invite=${inviteToken}&email=${encodeURIComponent(invitation.email)}` : '/register'}
          className="ml-1 font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 hover:underline"
        >
          Sign up
        </Link>
      </CardFooter>
    </Card>
  );
};
