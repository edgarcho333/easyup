
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { organizationService } from '../../services/organizationService';
import { projectService } from '../../services/projectService';
import { TeamMember, Role } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Users, ArrowRight, Check, Briefcase } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (projectId: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Data
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyPosts, setMonthlyPosts] = useState('8');

  // Team Selection
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [assignedMembers, setAssignedMembers] = useState<{userId: string, roleId: string}[]>([]);

  // Client Invite
  const [clientEmail, setClientEmail] = useState('');
  const [inviteClientNow, setInviteClientNow] = useState(false);

  useEffect(() => {
    if (isOpen && user?.currentOrganization) {
      // Load team for step 2
      organizationService.getTeamMembers(user.currentOrganization.id).then(setTeamMembers);
      organizationService.getRoles().then(setRoles);
      // Reset form
      setStep(1);
      setProjectName('');
      setClientName('');
      setDescription('');
      setAssignedMembers([]);
      setClientEmail('');
      setInviteClientNow(false);
      setError('');
    }
  }, [isOpen, user]);

  const handleAssignUser = (userId: string, roleId: string) => {
    setAssignedMembers(prev => {
      const filtered = prev.filter(p => p.userId !== userId);
      if (roleId === '') return filtered; // Unassign
      return [...filtered, { userId, roleId }];
    });
  };

  const handleSubmit = async () => {
    if (!user?.currentOrganization) return;
    
    setIsLoading(true);
    setError('');

    try {
      const projectId = await projectService.createProject(
        user.currentOrganization.id,
        user.id,
        {
          name: projectName,
          client_name: clientName,
          description,
          monthly_post_target: parseInt(monthlyPosts)
        },
        assignedMembers,
        inviteClientNow ? { email: clientEmail, name: clientName } : undefined
      );

      onSuccess(projectId);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.display_name || 'Member';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
             <h3 className="text-xl font-bold text-slate-900">Create New Project</h3>
             <p className="text-xs text-slate-500">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <Input
                label="Project Name"
                placeholder="e.g. Summer Marketing Campaign"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                required
              />
              <Input
                label="Client Name"
                placeholder="e.g. Acme Corp"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                required
              />
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea 
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:outline-none min-h-[100px] placeholder:text-slate-400"
                  placeholder="Project goals, timeline, etc."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <div className="w-1/3">
                <Input
                    label="Monthly Post Target"
                    type="number"
                    value={monthlyPosts}
                    onChange={e => setMonthlyPosts(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 flex items-start gap-2">
                <Users className="h-4 w-4 mt-0.5 shrink-0" />
                <p>Select team members to add to this project. They will have access to all project assets.</p>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {teamMembers.filter(m => m.status === 'active').map(member => {
                  const assigned = assignedMembers.find(a => a.userId === member.id);
                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${assigned ? 'bg-primary-100 text-primary-700' : 'bg-slate-200 text-slate-600'}`}>
                           {member.full_name?.[0] || member.email[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{member.full_name}</p>
                          <p className="text-xs text-slate-500">{member.role.display_name}</p>
                        </div>
                      </div>
                      <select
                        className="text-xs border rounded px-2 py-1 bg-white text-slate-900 focus:ring-1 focus:ring-primary-500"
                        value={assigned?.roleId || ''}
                        onChange={(e) => handleAssignUser(member.id!, e.target.value)}
                      >
                        <option value="" className="text-slate-500">Not Assigned</option>
                        {roles.filter(r => r.name !== 'super_admin').map(r => (
                          <option key={r.id} value={r.id} className="text-slate-900">{r.display_name}</option>
                        ))}
                      </select>
                    </div>
                  )
                })}
                {teamMembers.filter(m => m.status === 'active').length === 0 && (
                   <p className="text-center text-slate-500 py-4 text-sm">No active team members found. Invite them in Org Settings.</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
             <div className="space-y-6 animate-in slide-in-from-right duration-300">
               <div className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl">
                 <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                   <Briefcase className="h-5 w-5 text-indigo-600" />
                 </div>
                 <div className="space-y-3 flex-1">
                   <div className="flex items-center justify-between">
                      <label htmlFor="invite-toggle" className="font-medium text-slate-900">Invite Client Now?</label>
                      <input 
                        id="invite-toggle"
                        type="checkbox" 
                        className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        checked={inviteClientNow}
                        onChange={e => setInviteClientNow(e.target.checked)}
                      />
                   </div>
                   <p className="text-sm text-slate-500">If checked, we will send an invitation email to the client immediately giving them access to this project.</p>
                 </div>
               </div>

               {inviteClientNow && (
                 <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2">
                    <Input
                      label="Client Email"
                      type="email"
                      placeholder="client@company.com"
                      value={clientEmail}
                      onChange={e => setClientEmail(e.target.value)}
                    />
                    <p className="text-xs text-slate-400">We will send the invitation to this address.</p>
                 </div>
               )}
             </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-between bg-slate-50">
          <Button 
            variant="ghost" 
            disabled={step === 1} 
            onClick={() => setStep(s => s - 1)}
          >
            Back
          </Button>
          
          {step < 3 ? (
            <Button 
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && (!projectName || !clientName)}
            >
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} isLoading={isLoading}>
              <Check className="ml-2 h-4 w-4" /> Create Project
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
