
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { organizationService } from '../../services/organizationService';
import { emailService } from '../../services/emailService';
import { Role, Project } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Send, CheckCircle, Copy, Check, FolderOpen } from 'lucide-react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedProjectId?: string; // For inviting from project page
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedProjectId
}) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessStep, setIsSuccessStep] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user?.currentOrganization) {
      loadRoles();
      loadProjects();
      setIsSuccessStep(false);
      setEmail('');
      setPersonalMessage('');
      setError('');
      setInviteLink('');
      setLinkCopied(false);

      // Set preselected project if provided
      if (preselectedProjectId) {
        setSelectedProject(preselectedProjectId);
      } else {
        setSelectedProject('');
      }
    }
  }, [isOpen, user?.currentOrganization, preselectedProjectId]);

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

  const loadProjects = async () => {
    if (!user?.currentOrganization) return;
    try {
      const orgProjects = await organizationService.getOrganizationProjects(user.currentOrganization.id);
      setProjects(orgProjects);
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
      console.log('📧 [InviteMemberModal] Starting invitation process...');
      console.log('📧 Email:', email);
      console.log('📧 Role ID:', selectedRole);
      console.log('📧 Org ID:', user.currentOrganization.id);
      console.log('📧 Project ID:', selectedProject || 'none');

      const result = await organizationService.inviteMember(
        email,
        selectedRole,
        user.currentOrganization.id,
        user.id,
        personalMessage,
        selectedProject || undefined
      );

      console.log('✅ [InviteMemberModal] Invitation created:', result);

      setInviteLink(result.inviteLink);
      setIsSuccessStep(true);
      onSuccess();

      // Get role and project names for email
      const selectedRoleObj = roles.find(r => r.id === selectedRole);
      const selectedProjectObj = projects.find(p => p.id === selectedProject);

      // Send invitation email via Edge Function
      console.log('📧 [InviteMemberModal] Sending email...');
      await emailService.sendInvitationEmail({
        email,
        organizationName: user.currentOrganization.name,
        inviterName: user.full_name,
        roleName: selectedRoleObj?.display_name || 'Team Member',
        projectName: selectedProjectObj?.name,
        inviteLink: result.inviteLink,
        personalMessage: personalMessage || undefined
      });
      console.log('✅ [InviteMemberModal] Email sent (or logged in dev mode)');

    } catch (err: any) {
      console.error('❌ [InviteMemberModal] Error:', err);
      setError(err.message || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getSelectedProjectName = () => {
    if (!selectedProject) return null;
    const project = projects.find(p => p.id === selectedProject);
    return project?.name;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Invite Team Member</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {isSuccessStep ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Invitation Created!</h4>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                   Invitation sent to <strong className="text-slate-700 dark:text-slate-200">{email}</strong>
                </p>
                {getSelectedProjectName() && (
                  <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
                    + Access to project: {getSelectedProjectName()}
                  </p>
                )}
              </div>

              {/* Invite Link Section */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mt-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Share this link (expires in 7 days):
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteLink}
                    className="flex-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-600 dark:text-slate-300"
                  />
                  <Button
                    size="sm"
                    variant={linkCopied ? "primary" : "outline"}
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {linkCopied ? (
                      <><Check className="h-4 w-4 mr-1" /> Copied!</>
                    ) : (
                      <><Copy className="h-4 w-4 mr-1" /> Copy</>
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-3">
                The user will receive an email with this link. When they click it, they can register or log in to accept the invitation.
              </p>

              <Button onClick={onClose} className="w-full mt-4">Done</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-800 flex items-start gap-2">
                   <X className="h-4 w-4 mt-0.5 shrink-0" />
                   <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address <span className="text-red-500">*</span></label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role <span className="text-red-500">*</span></label>
                <select
                  className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  required
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.display_name}</option>
                  ))}
                </select>
              </div>

              {/* Project Selection */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Add to Project <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={selectedProject}
                    onChange={e => setSelectedProject(e.target.value)}
                  >
                    <option value="">Organization only (no project)</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name} — {project.client_name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedProject
                    ? "User will be added to both the organization and this project"
                    : "User will only be added to the organization"}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Message <span className="text-slate-400 font-normal">(Optional)</span></label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none placeholder:text-slate-400"
                  placeholder="Welcome to the team..."
                  value={personalMessage}
                  onChange={e => setPersonalMessage(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800">Cancel</Button>
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
