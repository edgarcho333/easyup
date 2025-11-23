
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { organizationService } from '../../services/organizationService';
import { Role } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Mail, Send, CheckCircle } from 'lucide-react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessStep, setIsSuccessStep] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadRoles();
      setIsSuccessStep(false);
      setEmail('');
      setPersonalMessage('');
      setError('');
    }
  }, [isOpen]);

  const loadRoles = async () => {
    try {
      const allRoles = await organizationService.getRoles();
      const filteredRoles = allRoles.filter(r => r.name !== 'super_admin');
      setRoles(filteredRoles);
      if (filteredRoles.length > 0) {
        setSelectedRole(filteredRoles[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.currentOrganization) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await organizationService.inviteMember(
        email, 
        selectedRole, 
        user.currentOrganization.id, 
        user.id,
        personalMessage
      );
      
      setIsSuccessStep(true);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">Invite Team Member</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {isSuccessStep ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900">Invitation Sent!</h4>
                <p className="text-slate-500 mt-2">
                   We've sent an invitation to <strong>{email}</strong>.
                </p>
                <p className="text-sm text-slate-400 mt-2">
                   They just need to register with this email to join your organization.
                </p>
              </div>
              <Button onClick={onClose} className="w-full mt-4">Done</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm border border-red-100 flex items-start gap-2">
                   <X className="h-4 w-4 mt-0.5 shrink-0" />
                   <span>{error}</span>
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Email Address <span className="text-red-500">*</span></label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
                <p className="text-xs text-slate-500">User will be auto-added when they register</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Role <span className="text-red-500">*</span></label>
                <select
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  required
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.display_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Message <span className="text-slate-400 font-normal">(Optional)</span></label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none placeholder:text-slate-400"
                  placeholder="Welcome to the team..."
                  value={personalMessage}
                  onChange={e => setPersonalMessage(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>
                  <Send className="h-4 w-4 mr-2" /> Send Invitation
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
