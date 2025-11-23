
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, ProjectSettings, UserRoleName } from '../../types';
import { projectService } from '../../services/projectService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { 
  Save, 
  Shield, 
  Sliders, 
  Archive, 
  Bell, 
  AlertTriangle, 
  Users, 
  CheckSquare,
  Activity,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  Target,
  DollarSign,
  Layout
} from 'lucide-react';

interface ProjectSettingsTabProps {
  project: Project;
  onUpdate: () => void;
}

// Default settings structure if missing
const DEFAULT_SETTINGS: ProjectSettings = {
  workflow: {
    require_client_approval: true,
    require_assets_for_approval: true,
    allow_client_comments: true,
    auto_archive_published: false,
  },
  permissions: [
    { action: 'create_ideas', allowed_roles: ['super_admin', 'account_manager', 'copywriter', 'content_creator', 'advertiser'] },
    { action: 'edit_content', allowed_roles: ['super_admin', 'account_manager', 'copywriter'] },
    { action: 'approve_concept', allowed_roles: ['super_admin', 'account_manager', 'client'] },
    { action: 'upload_assets', allowed_roles: ['super_admin', 'account_manager', 'designer', 'content_creator'] },
    { action: 'final_approval', allowed_roles: ['super_admin', 'account_manager', 'client'] },
    { action: 'manage_budget', allowed_roles: ['super_admin', 'account_manager', 'advertiser'] }
  ],
  notifications: {
    email_on_new_idea: true,
    email_on_approval: true,
    email_on_comment: true
  }
};

const ROLES: { id: UserRoleName; label: string }[] = [
  { id: 'super_admin', label: 'Super Admin' },
  { id: 'account_manager', label: 'Account Manager' },
  { id: 'copywriter', label: 'Copywriter' },
  { id: 'designer', label: 'Designer' },
  { id: 'content_creator', label: 'Content Creator' },
  { id: 'advertiser', label: 'Advertiser' },
  { id: 'client', label: 'Client' },
];

export const ProjectSettingsTab: React.FC<ProjectSettingsTabProps> = ({ project, onUpdate }) => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [clientName, setClientName] = useState(project.client_name);
  const [settings, setSettings] = useState<ProjectSettings>(project.settings || DEFAULT_SETTINGS);

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    try {
      await projectService.updateProject(project.id, {
        name,
        description,
        client_name: clientName,
        settings
      });
      addToast('Project settings saved', 'success');
      onUpdate();
    } catch (err) {
      console.error(err);
      addToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm("Are you sure you want to archive this project? It will be moved to the 'Archived' tab.")) return;
    try {
      await projectService.archiveProject(project.id);
      addToast('Project archived', 'info');
      navigate('/projects');
    } catch (err) {
      console.error(err);
      addToast('Failed to archive project', 'error');
    }
  };

  const togglePermission = (actionIndex: number, role: UserRoleName) => {
    const newPermissions = [...settings.permissions];
    const currentRoles = newPermissions[actionIndex].allowed_roles;
    
    if (currentRoles.includes(role)) {
      newPermissions[actionIndex].allowed_roles = currentRoles.filter(r => r !== role);
    } else {
      newPermissions[actionIndex].allowed_roles = [...currentRoles, role];
    }
    
    setSettings({ ...settings, permissions: newPermissions });
  };

  const statusConfig: Record<string, { icon: any, color: string, bg: string, border: string, label: string }> = {
    active: { icon: PlayCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Active' },
    setup: { icon: Sliders, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Setup Phase' },
    on_hold: { icon: PauseCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'On Hold' },
    completed: { icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Completed' },
    archived: { icon: Archive, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', label: 'Archived' },
  };

  const currentStatus = statusConfig[project.status] || statusConfig.setup;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Project Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`md:col-span-4 border-l-4 ${currentStatus.border.replace('border', 'border-l')}`}>
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className={`p-3 rounded-full ${currentStatus.bg} ${currentStatus.color} shrink-0`}>
                <StatusIcon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{currentStatus.label} Project</h3>
                <p className="text-sm text-slate-500">Current lifecycle status</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{project.members?.length || 0}</p>
                    <p className="text-xs text-slate-500">Members</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{project.monthly_post_target}/mo</p>
                    <p className="text-xs text-slate-500">Post Target</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{project.total_budget ? `$${project.total_budget.toLocaleString()}` : 'Not Set'}</p>
                    <p className="text-xs text-slate-500">Budget Cap</p>
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-slate-500" /> General Information
          </CardTitle>
          <CardDescription>Update basic project details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Project Name" value={name} onChange={e => setName(e.target.value)} />
            <Input label="Client Name" value={clientName} onChange={e => setClientName(e.target.value)} />
          </div>
          <div className="space-y-1.5 group">
            <label className="text-sm font-medium text-slate-700 ml-1">Description</label>
            <textarea 
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 min-h-[120px] resize-y transition-all duration-300 hover:bg-white hover:shadow-md hover:border-primary-200"
              placeholder="Enter a detailed description of the project goals and scope..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-slate-500" /> Role Permissions
          </CardTitle>
          <CardDescription>Define who can perform specific actions within this project.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-2 font-medium text-slate-500 w-1/3">Action</th>
                  {ROLES.map(role => (
                    <th key={role.id} className="py-3 px-2 font-medium text-slate-500 text-center text-xs uppercase tracking-wider">
                      {role.id === 'super_admin' ? 'Admin' : role.id === 'account_manager' ? 'Manager' : role.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settings.permissions.map((perm, idx) => (
                  <tr key={perm.action} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-2 font-medium text-slate-900 capitalize">
                      {perm.action.replace('_', ' ')}
                    </td>
                    {ROLES.map(role => {
                      const isAllowed = perm.allowed_roles.includes(role.id);
                      return (
                        <td key={role.id} className="py-4 px-2 text-center">
                          <input 
                            type="checkbox" 
                            checked={isAllowed}
                            onChange={() => togglePermission(idx, role.id)}
                            disabled={role.id === 'super_admin'} // Admin always has access
                            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer disabled:opacity-50"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-slate-500" /> Workflow Logic
          </CardTitle>
          <CardDescription>Configure strict rules for how content moves through the pipeline.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50">
            <div>
              <p className="font-medium text-slate-900">Require Client Approval</p>
              <p className="text-xs text-slate-500">Content cannot be scheduled without client sign-off.</p>
            </div>
            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input 
                  type="checkbox" 
                  name="toggle" 
                  id="toggle-1" 
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 checked:right-0 right-6 border-slate-300 checked:border-primary-600"
                  checked={settings.workflow.require_client_approval}
                  onChange={e => setSettings({...settings, workflow: {...settings.workflow, require_client_approval: e.target.checked}})}
                />
                <label htmlFor="toggle-1" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${settings.workflow.require_client_approval ? 'bg-primary-600' : 'bg-slate-300'}`}></label>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50">
            <div>
              <p className="font-medium text-slate-900">Require Assets for Final Review</p>
              <p className="text-xs text-slate-500">Cannot submit for final approval without uploaded files.</p>
            </div>
            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input 
                  type="checkbox" 
                  id="toggle-2" 
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 checked:right-0 right-6 border-slate-300 checked:border-primary-600"
                  checked={settings.workflow.require_assets_for_approval}
                  onChange={e => setSettings({...settings, workflow: {...settings.workflow, require_assets_for_approval: e.target.checked}})}
                />
                <label htmlFor="toggle-2" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${settings.workflow.require_assets_for_approval ? 'bg-primary-600' : 'bg-slate-300'}`}></label>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50">
            <div>
              <p className="font-medium text-slate-900">Auto-Archive Published</p>
              <p className="text-xs text-slate-500">Automatically move content to archive 7 days after publishing.</p>
            </div>
            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input 
                  type="checkbox" 
                  id="toggle-3" 
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 checked:right-0 right-6 border-slate-300 checked:border-primary-600"
                  checked={settings.workflow.auto_archive_published}
                  onChange={e => setSettings({...settings, workflow: {...settings.workflow, auto_archive_published: e.target.checked}})}
                />
                <label htmlFor="toggle-3" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${settings.workflow.auto_archive_published ? 'bg-primary-600' : 'bg-slate-300'}`}></label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="flex justify-end sticky bottom-6 z-10">
        <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-200 flex gap-3">
           <Button variant="ghost" onClick={onUpdate}>Discard Changes</Button>
           <Button onClick={handleSaveGeneral} isLoading={isSaving}>
             <Save className="h-4 w-4 mr-2" /> Save Configuration
           </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <Card className="border-red-100">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Archive Project</p>
              <p className="text-sm text-slate-500">This will hide the project from the active list but keep data intact.</p>
            </div>
            <Button variant="destructive" onClick={handleArchive}>
              <Archive className="h-4 w-4 mr-2" /> Archive Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
