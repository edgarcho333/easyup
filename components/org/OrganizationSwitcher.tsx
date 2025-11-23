
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { organizationService } from '../../services/organizationService';
import { ChevronDown, Plus, Check, Building2, Loader2, AlertCircle, ChevronsUpDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface OrganizationSwitcherProps {
  collapsed?: boolean;
}

export const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({ collapsed = false }) => {
  const { user, switchOrganization, refreshProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input when entering create mode
  useEffect(() => {
    if (isCreating && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isCreating]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setNewOrgName('');
        setCreateError(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleSwitch = (orgId: string) => {
    if (orgId === user.currentOrganization?.id) {
      setIsOpen(false);
      return;
    }
    switchOrganization(orgId);
    setIsOpen(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setIsLoading(true);
    setCreateError(null);
    
    try {
      const newOrgId = await organizationService.createOrganization(newOrgName.trim(), user.id);
      await refreshProfile();
      switchOrganization(newOrgId);
      setNewOrgName('');
      setIsCreating(false);
      setIsOpen(false);
    } catch (error: any) {
      console.error('Failed to create org', error);
      const msg = error?.message || 'Failed to create organization.';
      setCreateError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setIsCreating(false);
      setCreateError(null);
      setNewOrgName('');
    }
  };

  // Derived state for current org
  const currentOrgName = user.currentOrganization?.name || 'No Organization';
  const initials = currentOrgName.substring(0, 2).toUpperCase();

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={toggleOpen}
        className={`
          w-full flex items-center transition-all duration-200 border border-slate-200 bg-white hover:border-primary-300 hover:shadow-sm
          ${collapsed ? 'justify-center p-2 rounded-xl aspect-square' : 'justify-between p-2.5 rounded-xl'}
        `}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`
            rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white font-bold shadow-sm shrink-0
            ${collapsed ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm'}
          `}>
            {initials}
          </div>
          
          {!collapsed && (
            <div className="text-left min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate leading-tight">
                {currentOrgName}
              </p>
              <p className="text-[11px] text-slate-500 truncate font-medium">
                {user.currentRole?.replace('_', ' ') || 'Member'}
              </p>
            </div>
          )}
        </div>
        
        {!collapsed && (
          <ChevronsUpDown className="h-4 w-4 text-slate-400 ml-2 shrink-0" />
        )}
      </button>

      {/* Popup Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-64 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-left">
          {isCreating ? (
            <div className="p-3">
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="flex items-center justify-between">
                   <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">New Workspace</p>
                   {isLoading && <Loader2 className="h-3 w-3 animate-spin text-primary-600" />}
                </div>
                
                <Input 
                  ref={inputRef}
                  placeholder="Company Name" 
                  value={newOrgName}
                  onChange={e => setNewOrgName(e.target.value)}
                  className="h-9 text-sm"
                  disabled={isLoading}
                />
                
                {createError && (
                  <div className="flex items-start gap-1 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                    <span className="break-words flex-1">{createError}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs flex-1" 
                    onClick={() => setIsCreating(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm" 
                    className="h-8 text-xs flex-1" 
                    isLoading={isLoading}
                    disabled={!newOrgName.trim()}
                  >
                    Create
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto py-1">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Workspace
                </div>
                {user.organizations && user.organizations.length > 0 ? (
                  user.organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleSwitch(org.id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700 transition-colors group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Building2 className={`h-4 w-4 shrink-0 ${user.currentOrganization?.id === org.id ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <span className={`truncate ${user.currentOrganization?.id === org.id ? 'font-semibold text-slate-900' : ''}`}>{org.name}</span>
                      </div>
                      {user.currentOrganization?.id === org.id && (
                        <Check className="h-4 w-4 text-primary-600 shrink-0" />
                      )}
                    </button>
                  ))
                ) : (
                   <div className="px-4 py-4 text-center text-sm text-slate-500">
                     No organizations found
                   </div>
                )}
              </div>
              <div className="border-t border-slate-100 p-2 bg-slate-50/50">
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-primary-700 bg-white border border-slate-200 hover:border-primary-200 hover:shadow-sm rounded-lg transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Organization</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
