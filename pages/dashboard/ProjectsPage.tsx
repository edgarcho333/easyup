
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { Project } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CreateProjectModal } from '../../components/projects/CreateProjectModal';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Loader2, 
  MoreVertical, 
  Calendar,
  Folder,
  Users,
  AlertTriangle
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [user?.currentOrganization?.id]);

  const fetchProjects = async () => {
    if (!user?.currentOrganization) {
      setProjects([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await projectService.getProjects(
        user.currentOrganization.id,
        user.id,
        user.currentRole || 'client'
      );
      setProjects(data);
    } catch (err: any) {
      console.error(err);
      // Handle Infinite Recursion specifically
      if (err.message?.includes('42P17') || err.code === '42P17') {
        setError("Database Error: Infinite recursion detected in RLS policies. Please run the 'supabase_fix.sql' script in your Supabase SQL Editor.");
      } else {
        setError("Failed to load projects. " + (err.message || "Please check your connection."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.client_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'setup': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  // If no organization, show a helpful empty state
  if (!user?.currentOrganization && !isLoading) {
    return (
      <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        <Folder className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200">No Organization Selected</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-4">Please select or create an organization from the sidebar to view projects.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Projects</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your client campaigns and content.</p>
        </div>
        {(user?.currentRole === 'super_admin' || user?.currentRole === 'account_manager') && (
          <Button onClick={() => setIsCreateModalOpen(true)} disabled={!!error}>
            <Plus className="mr-2 h-4 w-4" /> Create Project
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3 animate-in fade-in">
           <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
           <div>
             <h3 className="font-bold text-red-800 dark:text-red-300">Error Loading Projects</h3>
             <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
             <Button variant="outline" size="sm" onClick={fetchProjects} className="mt-2 border-red-200 hover:bg-red-100 text-red-800 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-200 dark:border-red-800">Retry</Button>
           </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
      ) : !error && (
        <>
          {/* Filters & Controls */}
          <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                className="pl-9 border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white" 
                placeholder="Search projects or clients..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <select 
                    className="h-10 pl-9 pr-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="setup">Setup</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
              <div className="border-l border-slate-200 dark:border-slate-700 pl-2 flex gap-1">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredProjects.map(project => (
                <Link 
                  key={project.id} 
                  to={`/projects/${project.id}`}
                  className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700 transition-all p-6 flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
                      <Folder className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(project.status)}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 truncate">{project.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-4">{project.client_name}</p>
                  
                  {project.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-6 flex-1">
                      {project.description}
                    </p>
                  )}
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{project.members?.length || 0} Team</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(project.updated_at || project.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
              {filteredProjects.length === 0 && (
                <div className="col-span-full text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  <Folder className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200">No projects found</h3>
                  <p className="text-slate-500 dark:text-slate-400">Try adjusting your filters or create a new one.</p>
                </div>
              )}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Project Name</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Client</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Team Size</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Last Update</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredProjects.map(project => (
                    <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{project.name}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{project.client_name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(project.status)}`}>
                            {project.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{project.members?.length || 0}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(project.updated_at || project.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" className="dark:text-slate-400 dark:hover:text-slate-200"><MoreVertical className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  ))}
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No projects found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={(projectId) => {
           fetchProjects();
           navigate(`/projects/${projectId}`);
        }}
      />
    </div>
  );
};
