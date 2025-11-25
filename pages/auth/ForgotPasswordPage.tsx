
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="w-full shadow-xl border-0 dark:bg-slate-900 dark:border-slate-800">
        <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-4">
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
            <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Check your email</h3>
          <p className="text-slate-600 dark:text-slate-400 max-w-sm">
            We have sent a password reset link to <strong>{email}</strong>.
          </p>
          <Button 
            variant="outline" 
            className="mt-4 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" 
            onClick={() => setIsSubmitted(false)}
          >
            Try another email
          </Button>
          <Link to="/login" className="mt-4 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 flex items-center">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-xl border-0 dark:bg-slate-900 dark:border-slate-800">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center dark:text-white">Reset password</CardTitle>
        <CardDescription className="text-center dark:text-slate-400">
          Enter your email address and we'll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Send Reset Link
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 flex items-center">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
};
