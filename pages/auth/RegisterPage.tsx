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
    <Card className="w-full shadow-xl border-0">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Create an account</CardTitle>
        <CardDescription className="text-center">
          Get started with EASYUP today
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 flex items-center space-x-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
            <Input
              id="fullName"
              label="Full Name"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              id="orgName"
              label="Organization Name"
              placeholder="Acme Agency"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="text-sm text-slate-500">
            <div className="flex items-center gap-2 mt-2">
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${password.length > 0 ? (password.length >= 8 ? 'bg-green-500' : 'bg-yellow-500') : 'bg-slate-200'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${password.length >= 8 ? 'bg-green-500' : 'bg-slate-200'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${/[A-Z]/.test(password) && /[0-9]/.test(password) ? 'bg-green-500' : 'bg-slate-200'}`} />
            </div>
            <p className="mt-2 text-xs">Password must contain at least 8 characters.</p>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Create Account
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="ml-1 font-semibold text-primary-600 hover:text-primary-500 hover:underline">
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
};