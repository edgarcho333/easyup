
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { organizationService } from '../../services/organizationService';
import { TeamMember, Role } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { InviteMemberModal } from '../../components/org/InviteMemberModal';
import { 
  Trash2, 
  Loader2, 
  CheckCircle, 
  Mail, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Clock, 
  Copy,
  UserPlus,
  Building2
} from 'lucide-react';

export const OrganizationSettingsPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Org Info State
  const [orgName, setOrgName] = useState('');
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  const canManage = user?.currentRole === 'super_admin' || user?.currentRole === 'account_manager';

  useEffect(() => {
    if (user?.currentOrganization) {
      setOrgName(user.currentOrganization.name);
      fetchData();
      // Removed realtime subscriptions for mock mode
    } else if (user && !user.currentOrganization) {
        setIsLoading(false);
    }
  }, [user?.currentOrganization?.id]);

  const fetchData = async () => {
    if (!user?.currentOrganization) {
        setIsLoading(false);
        return;
    }
    setLoadError(null);
    // Only set loading if we don't have members yet
    if (members.length === 0) setIsLoading(true);

    try {
      const [membersData, rolesData] = await Promise.all([
        organizationService.getTeamMembers(user.currentOrganization.id),
        organizationService.getRoles()
      ]);
      setMembers(membersData);
      setRoles(rolesData);
    } catch (err: any) {
      console.error(err);
      setLoadError("Failed to load organization data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.currentOrganization) return;
    setIsSavingOrg(true);
    try {
      await organizationService.updateOrganization(user.currentOrganization.id, { name: orgName });
      await refreshProfile();
      setIsEditingInfo(false);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSavingOrg(false);
    }
  };

  const filteredMembers = members.filter(m => {
    const matchSearch = (m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleRemoveMember = async (member: TeamMember) => {
    if (!window.confirm(`Are you sure you want to remove ${member.full_name || member.email}? They will lose access immediately.`)) return;
    
    if (!user?.currentOrganization || !user.id) return;
    try {
      await organizationService.removeMember(member.membershipId, user.currentOrganization.id, user.id);
      fetchData(); // Manual refresh since no realtime
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleCancelInvite = async (id: string) => {
    if(!window.confirm("Cancel this invitation? The link will become invalid.")) return;
    try {
      await organizationService.revokeInvitation(id);
      fetchData(); // Manual refresh
    } catch(err: any) {
      setActionError(err.message);
    }
  };

  const handleRoleChange = async (memberId: string, newRoleId: string) => {
    try {
      await organizationService.updateMemberRole(memberId, newRoleId);
      fetchData(); // Manual refresh
    } catch (err: any) {
      setActionError(err.message);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;
  }

  if (!user?.currentOrganization && !isLoading) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
        <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-3" />
        <h3 className="text-lg font-medium text-slate-900">No Organization Selected</h3>
        <p className="text-slate-500 mb-4">Create a new organization using the switcher in the sidebar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <div className="flex items-center gap-2">
             <Building2 className="h-6 w-6 text-slate-400" />
             <h1 className="text-3xl font-bold text-slate-900">Organization Settings</h1>
           </div>
          <p className="text-slate-500 mt-1 ml-8">Manage your team, permissions, and organization details.</p>
        </div>
      </div>

      {loadError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-start gap-3 border border-red-100">
          <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium">Error:</span> {loadError}
            <div className="mt-2">
               <Button variant="outline" size="sm" className="border-red-200 bg-white hover:bg-red-50 text-red-700" onClick={fetchData}>Retry</Button>
            </div>
          </div>
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-center justify-between border border-red-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')}><XCircle className="h-5 w-5" /></button>
        </div>
      )}

      {!loadError && user?.currentOrganization && (
        <>
          {/* Organization Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col space-y-4">
                <div>
                   <label className="text-sm font-medium text-slate-700 block mb-1">Organization Name</label>
                   <div className="flex gap-2 max-w-md">
                     <Input 
                       value={orgName} 
                       onChange={e => setOrgName(e.target.value)} 
                       disabled={!isEditingInfo} 
                       className={isEditingInfo ? 'bg-white' : 'bg-slate-50 text-slate-600'}
                     />
                   </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div>
                    <span className="font-medium text-slate-700">Created:</span>{' '}
                    {new Date(user.currentOrganization.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Members:</span>{' '}
                    {members.length}
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <span className="font-medium text-slate-700">Organization ID:</span> 
                    <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-xs font-mono text-slate-600">{user.currentOrganization.id}</code>
                    <button onClick={() => {navigator.clipboard.writeText(user.currentOrganization?.id || ''); setActionError('');}} className="text-slate-400 hover:text-primary-600" title="Copy ID">
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              {canManage && (
                <div className="flex gap-2">
                  {!isEditingInfo ? (
                    <Button variant="outline" onClick={() => setIsEditingInfo(true)}>Edit Information</Button>
                  ) : (
                    <>
                      <Button onClick={handleUpdateOrg} isLoading={isSavingOrg}>Save Changes</Button>
                      <Button variant="ghost" onClick={() => { setIsEditingInfo(false); setOrgName(user.currentOrganization?.name || ''); }}>Cancel</Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Members Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold text-slate-900">Team Members ({members.length})</h2>
              {canManage && (
                <Button onClick={() => setIsInviteModalOpen(true)} className="w-full sm:w-auto">
                  <UserPlus className="mr-2 h-4 w-4" /> Invite Member
                </Button>
              )}
            </div>

            <Card>
              <CardContent className="p-6">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Search members by name or email..." 
                      className="pl-9" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <select 
                    className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                {/* Member List */}
                <div className="space-y-3">
                  {filteredMembers.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      {searchQuery ? 'No members match your search.' : 'No team members yet. Invite your first member!'}
                    </div>
                  ) : (
                    filteredMembers.map(member => (
                      <div key={member.membershipId} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors bg-white gap-4">
                        
                        <div className="flex items-start gap-4">
                          {member.avatar_url ? (
                             <img src={member.avatar_url} className="h-12 w-12 rounded-full bg-slate-200 object-cover" alt="" />
                          ) : (
                             <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${member.type === 'invitation' ? 'bg-yellow-100 text-yellow-700' : 'bg-primary-100 text-primary-700'}`}>
                               {member.type === 'invitation' ? <Mail className="h-6 w-6" /> : <span className="font-bold text-lg">{member.full_name?.[0] || member.email[0].toUpperCase()}</span>}
                             </div>
                          )}
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900">{member.full_name || (member.type === 'invitation' ? 'Pending User' : 'Unknown Name')}</span>
                              {member.id === user.id && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-medium">YOU</span>}
                            </div>
                            <div className="text-sm text-slate-500">{member.email}</div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                               {member.type === 'invitation' ? (
                                 <>Invited by {member.invited_by_name} • {new Date(member.joined_at).toLocaleDateString()}</>
                               ) : (
                                 <>Joined {new Date(member.joined_at).toLocaleDateString()}</>
                               )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pl-[4rem] sm:pl-0">
                          <div className="flex flex-col items-end gap-1">
                             {/* Status Badge */}
                             {member.status === 'active' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 border border-green-100"><CheckCircle className="h-3 w-3 mr-1"/> Active</span>}
                             {member.status === 'pending' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-50 text-yellow-700 border border-yellow-100"><Clock className="h-3 w-3 mr-1"/> Pending Invite</span>}

                             {/* Role Badge/Select */}
                             {canManage && member.status === 'active' && member.id !== user.id ? (
                               <select 
                                 value={member.role.id}
                                 onChange={(e) => handleRoleChange(member.membershipId, e.target.value)}
                                 className="text-xs border border-slate-200 bg-white rounded-md px-2 py-1 font-medium text-slate-700 cursor-pointer hover:bg-slate-50 focus:ring-1 focus:ring-primary-500 focus:outline-none mt-1"
                               >
                                 {roles.map(r => <option key={r.id} value={r.id}>{r.display_name}</option>)}
                               </select>
                             ) : (
                               <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 mt-1">
                                 {member.role.display_name}
                               </span>
                             )}
                          </div>

                          {/* Actions */}
                          {canManage && member.id !== user.id && (
                             <div className="flex items-center ml-2">
                                {member.type === 'invitation' ? (
                                  <Button variant="ghost" size="sm" onClick={() => handleCancelInvite(member.membershipId)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0" title="Cancel Invitation">
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0" title="Remove from Organization">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                             </div>
                          )}
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <InviteMemberModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        onSuccess={() => { fetchData(); }}
      />
    </div>
  );
};
