
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Check, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, fullName, orgName);
      navigate('/');
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-xl border-0 dark:bg-slate-900 dark:border-slate-800">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center dark:text-white">Create an account</CardTitle>
        <CardDescription className="text-center dark:text-slate-400">
          Get started with EASYUP today
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
            Create account
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="ml-1 font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 hover:underline">
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
};
