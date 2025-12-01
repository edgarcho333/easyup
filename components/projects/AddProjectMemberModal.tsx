import React, { useState, useEffect } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface AddProjectMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  existingMemberIds: string[];
  onSuccess: () => void;
}

interface OrgMember {
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role_id: string;
  role_name: string;
  role_display_name: string;
}

interface Role {
  id: string;
  name: string;
  display_name: string;
}

export const AddProjectMemberModal: React.FC<AddProjectMemberModalProps> = ({
  isOpen,
  onClose,
  projectId,
  existingMemberIds,
  onSuccess
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user?.currentOrganization) {
      fetchOrgMembers();
      fetchRoles();
    }
  }, [isOpen, user?.currentOrganization]);

  const fetchOrgMembers = async () => {
    if (!user?.currentOrganization) return;
    setIsLoading(true);

    try {
      const { data: memberships, error } = await supabase
        .from('user_organizations')
        .select('user_id, role_id')
        .eq('organization_id', user.currentOrganization.id)
        .eq('status', 'active');

      if (error) throw error;

      const members: OrgMember[] = [];
      for (const m of (memberships || [])) {
        // Skip existing project members
        if (existingMemberIds.includes(m.user_id)) continue;

        const { data: userData } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url')
          .eq('id', m.user_id)
          .maybeSingle();

        const { data: roleData } = await supabase
          .from('roles')
          .select('id, name, display_name')
          .eq('id', m.role_id)
          .maybeSingle();

        if (userData && roleData) {
          members.push({
            user_id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
            role_id: roleData.id,
            role_name: roleData.name,
            role_display_name: roleData.display_name
          });
        }
      }

      setOrgMembers(members);
    } catch (err) {
      console.error('Error fetching org members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    const { data, error } = await supabase
      .from('roles')
      .select('id, name, display_name');

    if (!error && data) {
      setRoles(data);
    }
  };

  const handleAdd = async () => {
    if (!selectedUserId || !selectedRoleId || !user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: selectedUserId,
          role_id: selectedRoleId,
          added_by: user.id
        });

      if (error) throw error;

      addToast('Member added to project', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error adding member:', err);
      addToast(err.message || 'Failed to add member', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const availableMembers = orgMembers.filter(m => !existingMemberIds.includes(m.user_id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary-600" />
            Add Team Member
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          ) : availableMembers.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p>No available members to add.</p>
              <p className="text-sm mt-1">All organization members are already in this project.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Member
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    // Auto-select their org role
                    const member = orgMembers.find(m => m.user_id === e.target.value);
                    if (member) setSelectedRoleId(member.role_id);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="">Choose a member...</option>
                  {availableMembers.map(member => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.full_name || member.email} ({member.role_display_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Project Role
                </label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="">Choose a role...</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedUserId || !selectedRoleId || isSaving}
            isLoading={isSaving}
          >
            Add Member
          </Button>
        </div>
      </div>
    </div>
  );
};
