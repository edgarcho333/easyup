
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ideaService } from '../../services/ideaService';
import { Idea, Project } from '../../types';
import { projectService } from '../../services/projectService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CreateIdeaModal } from '../../components/ideas/CreateIdeaModal';
import { GenerateLinkModal } from '../../components/guest/GenerateLinkModal';
import { BulkActionModal } from '../../components/ideas/BulkActionModal';
import { IdeaStatusBadge } from '../../components/ideas/IdeaStatusBadge';
import { Loader2, Plus, Search, Calendar, Filter, LayoutGrid, List, ArrowLeft, Link as LinkIcon, CheckSquare, Settings, Users, Lightbulb, DollarSign, Layout, Activity, MessageSquare, Briefcase, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { ProjectChatSidebar } from '../../components/projects/ProjectChatSidebar';

export const ProjectIdeasPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Selection & Bulk Actions
  const [selectedIdeaIds, setSelectedIdeaIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'changes' | null>(null);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  const fetchData = async (projectId: string) => {
    try {
      const [p, i] = await Promise.all([
        projectService.getProject(projectId),
        ideaService.getProjectIdeas(projectId)
      ]);
      setProject(p);
      setIdeas(i);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (ideaId: string) => {
    setSelectedIdeaIds(prev => 
      prev.includes(ideaId) ? prev.filter(id => id !== ideaId) : [...prev, ideaId]
    );
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIdeaIds([]);
  };

  const handleBulkConfirm = async (comment?: string) => {
    if (!user || !bulkAction) return;
    setIsBulkActionLoading(true);
    
    try {
        let processedCount = 0;
        const promises = selectedIdeaIds.map(async (ideaId) => {
            const idea = ideas.find(i => i.id === ideaId);
            if (!idea) return;

            if (bulkAction === 'approve') {
                let nextStatus: any = null;
                // Simple state machine for bulk approval
                if (idea.status === 'pending_approval' || idea.status === 'draft') nextStatus = 'in_production';
                else if (idea.status === 'in_production') nextStatus = 'pending_final_review';
                else if (idea.status === 'pending_final_review') nextStatus = 'scheduled';
                
                if (nextStatus) {
                    await ideaService.updateStatusWithApproval(
                        idea.id,
                        nextStatus,
                        user.id,
                        user.currentRole || 'unknown',
                        'approved',
                        'Bulk approved'
                    );
                    processedCount++;
                }
            } else {
                // Changes requested
                await ideaService.updateStatusWithApproval(
                    idea.id,
                    'changes_requested',
                    user.id,
                    user.currentRole || 'unknown',
                    'requested_changes',
                    comment || 'Bulk changes requested'
                );
                processedCount++;
            }
        });

        await Promise.all(promises);
        addToast(`Bulk action completed on ${processedCount} items`, 'success');
        setBulkAction(null);
        setSelectedIdeaIds([]);
        setIsSelectionMode(false);
        fetchData(id!); // Refresh
    } catch (err) {
        console.error(err);
        addToast('Some items failed to update', 'error');
    } finally {
        setIsBulkActionLoading(false);
    }
  };

  const filteredIdeas = ideas.filter(idea => 
    idea.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    idea.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layout },
    { id: 'content', label: 'Content', icon: Lightbulb },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'budget', label: 'Budget', icon: DollarSign },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === 'content') {
      navigate(`/projects/${id}/ideas`);
    } else if (tabId === 'budget') {
      navigate(`/projects/${id}/budget`);
    } else {
      navigate(`/projects/${id}?tab=${tabId}`); // Pass tab query param
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      
      {/* Unified Command Header - Sticky Top */}
      <div className="sticky top-0 z-30 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 mb-6">
        <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row items-center justify-between gap-4 transition-all">
           
           {/* LEFT: Project Context */}
           <div className="flex items-center gap-4 w-full lg:w-auto">
              <button 
                onClick={() => navigate('/projects')}
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm group shrink-0"
                title="Back to Projects"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              
              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
              
              <div className="flex items-center gap-3 min-w-0 flex-1">
                 {project ? (
                   <>
                     <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner ring-2 ring-white">
                        {project.name[0]}
                     </div>
                     <div className="flex flex-col min-w-0">
                        <h1 className="text-sm font-bold text-slate-900 truncate leading-tight flex items-center gap-2">
                          {project.name}
                          <span className={`inline-flex w-2 h-2 rounded-full ${project.status === 'active' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-slate-300'}`}></span>
                        </h1>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium leading-tight">
                           <Briefcase className="h-3 w-3" />
                           <span className="truncate">{project.client_name}</span>
                        </div>
                     </div>
                   </>
                 ) : (
                   <>
                     <div className="w-9 h-9 rounded-lg bg-slate-200 animate-pulse shrink-0"></div>
                     <div className="flex flex-col gap-1.5 w-32">
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-full"></div>
                        <div className="h-3 bg-slate-200 rounded animate-pulse w-2/3"></div>
                     </div>
                   </>
                 )}
              </div>
           </div>

           {/* CENTER: Navigation Tabs */}
           <div className="w-full lg:w-auto overflow-x-auto no-scrollbar flex justify-center order-last lg:order-none">
              <div className="flex items-center p-1 bg-slate-100/80 rounded-full border border-slate-200/60 backdrop-blur-sm">
                 {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = tab.id === 'content'; // This is technically legacy page for ideas
                    return (
                       <button
                          key={tab.id}
                          onClick={() => handleTabClick(tab.id)}
                          className={`
                             flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap
                             ${isActive 
                                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}
                          `}
                       >
                          <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                          {tab.label}
                       </button>
                    );
                 })}
              </div>
           </div>

           {/* RIGHT: Actions */}
           <div className="flex items-center justify-end gap-3 w-full lg:w-auto hidden sm:flex">
              <button 
                onClick={() => setIsChatOpen(true)} 
                className="group relative flex items-center gap-2 pl-3 pr-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                 <div className="relative">
                   <MessageSquare className="h-4 w-4 text-indigo-200" />
                   <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-blue-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                 </div>
                 <span className="font-medium text-xs">Project Chat</span>
              </button>
           </div>
        </div>
      </div>

      <div className="flex-1 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {isLoading ? (
           <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
        ) : !project ? (
           <div className="p-8 text-center text-slate-500">Project not found</div>
        ) : (
           <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Content Ideas</h1>
                <p className="text-slate-500 mt-1 font-medium">Legacy View</p>
              </div>
              <div className="flex gap-2">
                 {isSelectionMode && selectedIdeaIds.length > 0 && (
                   <>
                     <Button variant="outline" onClick={() => setBulkAction('approve')} className="animate-in fade-in zoom-in text-green-600 border-green-200 hover:bg-green-50">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Approve ({selectedIdeaIds.length})
                     </Button>
                     <Button variant="outline" onClick={() => setBulkAction('changes')} className="animate-in fade-in zoom-in text-orange-600 border-orange-200 hover:bg-orange-50">
                        <MessageSquare className="mr-2 h-4 w-4" /> Changes ({selectedIdeaIds.length})
                     </Button>
                     <Button variant="outline" onClick={() => setIsLinkModalOpen(true)} className="animate-in fade-in zoom-in">
                       <LinkIcon className="mr-2 h-4 w-4" /> Link
                     </Button>
                   </>
                 )}
                 <Button variant={isSelectionMode ? 'secondary' : 'outline'} onClick={toggleSelectionMode}>
                   <CheckSquare className="mr-2 h-4 w-4" /> {isSelectionMode ? 'Cancel' : 'Select'}
                 </Button>
                 <Button onClick={() => setIsCreateModalOpen(true)}>
                   <Plus className="mr-2 h-4 w-4" /> Create Idea
                 </Button>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    className="pl-9 border-slate-200" 
                    placeholder="Search ideas..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
               </div>
               <div className="flex gap-2">
                  <Button variant="outline" className="text-slate-600">
                    <Filter className="h-4 w-4 mr-2" /> Status
                  </Button>
                  <div className="border-l border-slate-200 pl-2 flex gap-1">
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <LayoutGrid className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
               </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIdeas.map(idea => (
                  <Card 
                    key={idea.id} 
                    className={`hover:shadow-md transition-all border-slate-200 group relative ${selectedIdeaIds.includes(idea.id) ? 'ring-2 ring-primary-500 border-primary-500' : ''}`}
                  >
                    {isSelectionMode && (
                      <div className="absolute top-3 left-3 z-10">
                        <input 
                          type="checkbox" 
                          className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer shadow-sm"
                          checked={selectedIdeaIds.includes(idea.id)}
                          onChange={() => toggleSelection(idea.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                    
                    <div onClick={() => !isSelectionMode && navigate(`/projects/${id}/ideas/${idea.id}`)} className={isSelectionMode ? 'cursor-default' : 'cursor-pointer'}>
                      {/* Simulated Image Placeholder */}
                      <div className="h-40 bg-slate-100 rounded-t-xl flex items-center justify-center relative overflow-hidden">
                         {idea.post_type === 'video' || idea.post_type === 'reel' ? (
                           <div className="h-12 w-12 rounded-full bg-black/10 flex items-center justify-center">
                             <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[16px] border-l-slate-600 border-b-8 border-b-transparent ml-1"></div>
                           </div>
                         ) : (
                           <div className="text-slate-300 font-bold text-4xl select-none">IMG</div>
                         )}
                         <div className="absolute top-3 right-3">
                           <IdeaStatusBadge status={idea.status} />
                         </div>
                      </div>
                      
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded uppercase">{idea.post_type}</span>
                          {idea.planned_post_date && (
                            <span className="text-xs text-slate-400 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(idea.planned_post_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">{idea.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4 min-h-[40px]">{idea.content}</p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                             <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                               {idea.creator?.full_name?.[0]}
                             </div>
                             <span className="text-xs text-slate-500 truncate max-w-[80px]">{idea.creator?.full_name}</span>
                          </div>
                          <div className="flex gap-1">
                             {idea.platforms.map(p => (
                               <div key={p} className="h-5 w-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] text-slate-600 capitalize" title={p}>
                                 {p[0]}
                               </div>
                             ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                {filteredIdeas.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <p className="text-slate-500">No ideas found. Create one to get started!</p>
                  </div>
                )}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
               <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {isSelectionMode && <th className="w-10 px-4"></th>}
                          <th className="px-6 py-3 font-medium text-slate-500">Title</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Type</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Creator</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Date</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {filteredIdeas.map(idea => (
                          <tr 
                             key={idea.id} 
                             className={`hover:bg-slate-50 transition-colors ${isSelectionMode ? '' : 'cursor-pointer'}`}
                             onClick={() => !isSelectionMode && navigate(`/projects/${id}/ideas/${idea.id}`)}
                          >
                             {isSelectionMode && (
                               <td className="px-4 py-3">
                                  <input 
                                    type="checkbox" 
                                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                    checked={selectedIdeaIds.includes(idea.id)}
                                    onChange={() => toggleSelection(idea.id)}
                                  />
                               </td>
                             )}
                             <td className="px-6 py-3 font-medium text-slate-900">{idea.title}</td>
                             <td className="px-6 py-3"><IdeaStatusBadge status={idea.status} /></td>
                             <td className="px-6 py-3 capitalize text-slate-600">{idea.post_type}</td>
                             <td className="px-6 py-3 text-slate-600">{idea.creator?.full_name}</td>
                             <td className="px-6 py-3 text-slate-600">
                                {idea.planned_post_date ? new Date(idea.planned_post_date).toLocaleDateString() : '-'}
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}
           </>
        )}
      </div>

      {/* Create Modal */}
      <CreateIdeaModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => fetchData(id!)}
        projectId={id!}
      />

      {/* Bulk Actions Modal */}
      <BulkActionModal 
        isOpen={!!bulkAction}
        action={bulkAction || 'approve'}
        count={selectedIdeaIds.length}
        onClose={() => setBulkAction(null)}
        onConfirm={handleBulkConfirm}
        isLoading={isBulkActionLoading}
      />

      {/* Link Generator Modal */}
      <GenerateLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        selectedIdeas={ideas.filter(i => selectedIdeaIds.includes(i.id))}
        projectId={id!}
      />

      {project && (
        <ProjectChatSidebar 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          projectId={id!}
        />
      )}
    </div>
  );
};
