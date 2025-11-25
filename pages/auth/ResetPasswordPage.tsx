
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-xl border-0 dark:bg-slate-900 dark:border-slate-800">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center dark:text-white">Set new password</CardTitle>
        <CardDescription className="text-center dark:text-slate-400">
          Enter your new password below to update your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span>Password updated successfully! Redirecting...</span>
            </div>
          )}

          <Input
            id="password"
            type="password"
            label="New Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={success}
            className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
          />
          <Input
            id="confirmPassword"
            type="password"
            label="Confirm New Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={success}
            className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
          />
          
          {!success && (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2 mt-2">
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${password.length > 0 ? (password.length >= 8 ? 'bg-green-500' : 'bg-yellow-500') : 'bg-slate-200 dark:bg-slate-700'}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${password.length >= 8 ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${/[A-Z]/.test(password) && /[0-9]/.test(password) ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading} disabled={success}>
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
