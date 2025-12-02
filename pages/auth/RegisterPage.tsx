
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { organizationService } from '../../services/organizationService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AlertCircle, Building2, UserPlus } from 'lucide-react';
import { Invitation } from '../../types';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Invitation handling
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const prefillEmail = searchParams.get('email');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoadingInvite, setIsLoadingInvite] = useState(!!inviteToken);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Load invitation if token present
  useEffect(() => {
    if (inviteToken) {
      loadInvitation();
    }
    if (prefillEmail) {
      setEmail(decodeURIComponent(prefillEmail));
    }
  }, [inviteToken, prefillEmail]);

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

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      // If registering with invitation, we don't need org name
      // The user will be added to the invited organization
      if (invitation) {
        // Register without creating new org
        const userId = await register(email, password, fullName, '');

        // Accept the invitation
        if (userId && inviteToken) {
          try {
            await organizationService.acceptInvitationByToken(inviteToken, userId);
            navigate('/', { state: { invitationAccepted: true, orgName: invitation.organization?.name } });
          } catch (invErr) {
            // Registration succeeded but invitation acceptance failed
            // User is still registered, just redirect to dashboard
            console.error('Failed to accept invitation:', invErr);
            navigate('/');
          }
        } else {
          navigate('/');
        }
      } else {
        // Normal registration with new organization
        await register(email, password, fullName, orgName);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
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
                <UserPlus className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center dark:text-white">Join {invitation.organization?.name}</CardTitle>
            <CardDescription className="text-center dark:text-slate-400">
              Create your account to accept the invitation
            </CardDescription>
          </>
        ) : (
          // Normal registration header
          <>
            <CardTitle className="text-2xl text-center dark:text-white">Create an account</CardTitle>
            <CardDescription className="text-center dark:text-slate-400">
              Get started with EASYUP today
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
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
            <Input
              id="fullName"
              type="text"
              label="Full Name"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
            />

            {/* Only show org name field for normal registration */}
            {!invitation && (
              <Input
                id="orgName"
                type="text"
                label="Organization Name"
                placeholder="ACME Marketing"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
              />
            )}

            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!!invitation} // Disable email editing when invited
              className="dark:bg-slate-950 dark:border-slate-800 dark:text-white disabled:opacity-60"
            />
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
            />
          </div>
          <Button type="submit" className="w-full" isLoading={isLoading}>
            {invitation ? 'Create Account & Join' : 'Create account'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{' '}
        <Link
          to={invitation ? `/login?invite=${inviteToken}` : '/login'}
          className="ml-1 font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 hover:underline"
        >
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
};
