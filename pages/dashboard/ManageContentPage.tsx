
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ideaService } from '../../services/ideaService';
import { assetService } from '../../services/assetService';
import { projectService } from '../../services/projectService';
import { Idea, Project } from '../../types';
import { Button } from '../../components/ui/Button';
import { CreateIdeaModal } from '../../components/ideas/CreateIdeaModal';
import { IdeaCard } from '../../components/ideas/IdeaCard';
import { ContentCalendar } from '../../components/ideas/ContentCalendar';
import { ApprovalModal } from '../../components/ideas/ApprovalModal';
import { BulkActionModal } from '../../components/ideas/BulkActionModal';
import { ProjectChatSidebar } from '../../components/projects/ProjectChatSidebar';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationDropdown } from '../../components/notifications/NotificationDropdown';
import { 
  Loader2, 
  Plus, 
  FileText, 
  Palette, 
  Calendar as CalendarIcon, 
  ArrowLeft, 
  Search,
  LayoutGrid,
  Settings, Users, Lightbulb, CheckSquare, DollarSign, Layout, Activity, MessageSquare, Briefcase,
  CheckCircle2,
  X,
  Bell
} from 'lucide-react';

export const ManageContentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // New state for editing
  const [ideaToEdit, setIdeaToEdit] = useState<Idea | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Action States
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Selection & Bulk Action States
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIdeaIds, setSelectedIdeaIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'approve' | 'changes' | null>(null);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  // Tabs State
  const [activeTab, setActiveTab] = useState<'concept' | 'production' | 'ready'>('concept');

  useEffect(() => {
    if (id) fetchData(id);
  }, [id]);

  const fetchData = async (projectId: string) => {
    try {
      const [p, i] = await Promise.all([
        projectService.getProject(projectId),
        ideaService.getProjectIdeas(projectId)
      ]);
      
      const ideasWithAssets = await Promise.all(i.map(async (idea) => {
         const assets = await assetService.getAssets(idea.id);
         return { ...idea, assets };
      }));

      setProject(p);
      setIdeas(ideasWithAssets);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calendar Reschedule Logic
  const handleReschedule = async (ideaId: string, newDate: string) => {
    try {
      // Optimistic update for UI responsiveness
      setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, planned_post_date: newDate } : i));
      
      await ideaService.updateIdea(ideaId, { planned_post_date: newDate });
      addToast('Post rescheduled', 'success');
      
      // Background refresh to ensure consistency
      if (id) fetchData(id);
    } catch (err) {
      console.error("Reschedule failed", err);
      addToast("Failed to reschedule post", 'error');
      if (id) fetchData(id); // Revert
    }
  };

  // Selection Logic
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIdeaIds([]);
  };

  const toggleSelection = (ideaId: string) => {
    if (!isSelectionMode) setIsSelectionMode(true); // Auto-enable mode if triggering single selection
    setSelectedIdeaIds(prev => 
      prev.includes(ideaId) ? prev.filter(id => id !== ideaId) : [...prev, ideaId]
    );
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
                // State machine for bulk approval
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
        await fetchData(id!);
    } catch (err) {
        console.error(err);
        addToast('Some items failed to update', 'error');
    } finally {
        setIsBulkActionLoading(false);
    }
  };

  // Approval Flow
  const openApprovalModal = (idea: Idea) => {
    setSelectedIdea(idea);
    setIsApprovalModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedIdea || !user) return;
    
    setIsActionLoading(true);
    try {
      let nextStatus: any = 'in_production';
      let message = 'Concept approved';

      if (selectedIdea.status === 'in_production') {
         // Fast track from production -> pending review OR scheduled? 
         // Usually production needs asset upload, so let's move it to 'pending_final_review' 
         // so user can confirm assets are there, or strict jump to review.
         nextStatus = 'pending_final_review';
         message = 'Moved to Final Review';
      } else if (selectedIdea.status === 'pending_final_review') {
         nextStatus = 'scheduled';
         message = 'Content approved and scheduled';
      }

      await ideaService.updateStatusWithApproval(
        selectedIdea.id,
        nextStatus,
        user.id,
        user.currentRole || 'unknown',
        'approved',
        'Approved from dashboard'
      );
      
      addToast(message, 'success');
      setIsApprovalModalOpen(false);
      setSelectedIdea(null);
      await fetchData(project!.id);
    } catch (err) {
      console.error(err);
      addToast('Failed to approve', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Changes/Feedback Flow
  const openFeedbackModal = (idea: Idea) => {
    setSelectedIdea(idea);
    setFeedbackComment('');
    setIsFeedbackModalOpen(true);
  };

  const submitFeedback = async () => {
    if (!selectedIdea || !user) return;
    setIsActionLoading(true);
    try {
      await ideaService.updateStatusWithApproval(
        selectedIdea.id,
        'changes_requested',
        user.id,
        user.currentRole || 'unknown',
        'requested_changes',
        feedbackComment
      );
      addToast('Feedback submitted', 'success');
      setIsFeedbackModalOpen(false);
      setSelectedIdea(null);
      await fetchData(project!.id);
    } catch (err) {
      console.error(err);
      addToast('Failed to submit feedback', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditIdea = (idea: Idea) => {
    setIdeaToEdit(idea);
    setIsCreateModalOpen(true);
  };

  const handleDeleteIdea = async (ideaId: string) => {
    if (!confirm("Are you sure you want to delete this idea? This cannot be undone.")) return;
    try {
      await ideaService.deleteIdea(ideaId);
      addToast('Idea deleted', 'info');
      await fetchData(id!);
    } catch (err) {
      console.error(err);
      addToast('Failed to delete idea', 'error');
    }
  };

  const filteredIdeas = ideas.filter(i => 
    i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 1. Concept & Strategy
  const conceptIdeas = filteredIdeas.filter(i => 
    i.status === 'draft' || 
    i.status === 'pending_approval' || 
    i.status === 'changes_requested' || 
    i.status === 'rejected'
  );

  // 2. Visual Production
  const productionIdeas = filteredIdeas.filter(i => 
    i.status === 'in_production' || 
    i.status === 'pending_final_review'
  );

  // 3. Calendar / Ready
  const scheduledIdeas = filteredIdeas.filter(i => 
    i.status === 'scheduled' || 
    i.status === 'published'
  );

  const getActiveList = () => {
    switch(activeTab) {
      case 'concept': return conceptIdeas;
      case 'production': return productionIdeas;
      case 'ready': return scheduledIdeas;
      default: return [];
    }
  };

  const canManage = user?.currentRole === 'super_admin' || user?.currentRole === 'account_manager' || user?.currentRole === 'client';

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
      // Already here
    } else if (tabId === 'budget') {
      navigate(`/projects/${id}/budget`);
    } else {
      navigate(`/projects/${id}?tab=${tabId}`); // Pass tab query param
    }
  };

  const handleTabSwitch = (tab: 'concept' | 'production' | 'ready') => {
    setActiveTab(tab);
    setIsSelectionMode(false);
    setSelectedIdeaIds([]);
  };

  // Filter notifications for this project
  const projectUnreadCount = notifications.filter(n => n.project_id === id && !n.is_read).length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
      
      {/* Unified Command Header - Sticky Top */}
      <div className="sticky top-0 z-30 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 mb-6">
        <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row items-center justify-between gap-4 transition-all">
           
           {/* LEFT: Project Context */}
           <div className="flex items-center gap-4 w-full lg:w-auto">
              <button 
                onClick={() => navigate('/projects')}
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm group shrink-0"
                title="Back to Projects"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
              
              <div className="flex items-center gap-3 min-w-0 flex-1">
                 {project ? (
                   <>
                     <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner ring-2 ring-white dark:ring-slate-800">
                        {project.name[0]}
                     </div>
                     <div className="flex flex-col min-w-0">
                        <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight flex items-center gap-2">
                          {project.name}
                          <span className={`inline-flex w-2 h-2 rounded-full ${project.status === 'active' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-slate-300'}`}></span>
                        </h1>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                           <Briefcase className="h-3 w-3" />
                           <span className="truncate">{project.client_name}</span>
                        </div>
                     </div>
                   </>
                 ) : (
                   <>
                     <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0"></div>
                     <div className="flex flex-col gap-1.5 w-32">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-full"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-2/3"></div>
                     </div>
                   </>
                 )}
              </div>
           </div>

           {/* CENTER: Navigation Tabs */}
           <div className="w-full lg:w-auto overflow-x-auto no-scrollbar flex justify-center order-last lg:order-none">
              <div className="flex items-center p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-full border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm">
                 {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = tab.id === 'content';
                    return (
                       <button
                          key={tab.id}
                          onClick={() => handleTabClick(tab.id)}
                          className={`
                             flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap
                             ${isActive 
                                ? 'bg-primary-600 text-white shadow-md ring-2 ring-primary-100 dark:ring-primary-900' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'}
                          `}
                       >
                          <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          {tab.label}
                       </button>
                    );
                 })}
              </div>
           </div>

           {/* RIGHT: Actions */}
           <div className="flex items-center justify-end gap-3 w-full lg:w-auto hidden sm:flex">
              {/* Project Notification Bell */}
              <div className="relative">
                  <button 
                      onClick={() => setIsNotifOpen(!isNotifOpen)}
                      className="h-9 w-9 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                  >
                      <Bell className="h-4 w-4" />
                      {projectUnreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
                      )}
                  </button>
                  <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} projectId={id} />
              </div>

              <button 
                onClick={() => setIsChatOpen(true)} 
                className="group relative flex items-center gap-2 pl-3 pr-4 py-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                 <div className="relative">
                   <MessageSquare className="h-4 w-4 text-indigo-200 dark:text-indigo-600" />
                   <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-blue-500 rounded-full border-2 border-slate-900 dark:border-slate-100 animate-pulse"></span>
                 </div>
                 <span className="font-medium text-xs">Project Chat</span>
              </button>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {isLoading ? (
           <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
        ) : !project ? (
           <div className="p-8 text-center text-slate-500 dark:text-slate-400">Project not found</div>
        ) : (
           <>
            {/* Page Specific Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
              <div className="flex items-center gap-4">
                 <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Content Manager</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Create, review, and schedule posts.</p>
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                 <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      className="pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-400 outline-none w-full sm:w-64 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                      placeholder="Search content..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                 </div>
                 
                 {/* Selection / New Idea Actions */}
                 <div className="flex gap-2">
                    {isSelectionMode ? (
                        <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                            <Button 
                                variant="outline" 
                                className="text-green-600 border-green-200 dark:border-green-900 hover:bg-green-50 dark:hover:bg-green-900/20"
                                disabled={selectedIdeaIds.length === 0}
                                onClick={() => setBulkAction('approve')}
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Approve ({selectedIdeaIds.length})
                            </Button>
                            <Button 
                                variant="outline"
                                className="text-orange-600 border-orange-200 dark:border-orange-900 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                disabled={selectedIdeaIds.length === 0}
                                onClick={() => setBulkAction('changes')}
                            >
                                <MessageSquare className="h-4 w-4 mr-2" /> Changes ({selectedIdeaIds.length})
                            </Button>
                            <Button variant="ghost" onClick={toggleSelectionMode} title="Cancel Selection" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Button variant="outline" onClick={toggleSelectionMode} className="hidden sm:flex border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">Select</Button>
                            <Button onClick={() => { setIdeaToEdit(null); setIsCreateModalOpen(true); }} className="shadow-sm shadow-primary-200 dark:shadow-none">
                                <Plus className="mr-2 h-4 w-4" /> New Idea
                            </Button>
                        </>
                    )}
                 </div>
              </div>
            </div>

            {/* Content Navigation Tabs */}
            <div className="flex flex-col sm:flex-row p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl w-full lg:w-fit mb-6 border border-slate-200/50 dark:border-slate-700/50">
              <button
                onClick={() => handleTabSwitch('concept')}
                className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'concept' 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <FileText className={`h-4 w-4 ${activeTab === 'concept' ? 'text-blue-500' : 'text-slate-400'}`} />
                Concept
                <span className={`ml-1.5 text-xs px-2 py-0.5 rounded-full ${activeTab === 'concept' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                  {conceptIdeas.length}
                </span>
              </button>

              <button
                onClick={() => handleTabSwitch('production')}
                className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'production' 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Palette className={`h-4 w-4 ${activeTab === 'production' ? 'text-purple-500' : 'text-slate-400'}`} />
                Visuals
                <span className={`ml-1.5 text-xs px-2 py-0.5 rounded-full ${activeTab === 'production' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                  {productionIdeas.length}
                </span>
              </button>

              <button
                onClick={() => handleTabSwitch('ready')}
                className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'ready' 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <CalendarIcon className={`h-4 w-4 ${activeTab === 'ready' ? 'text-green-500' : 'text-slate-400'}`} />
                Ready
                <span className={`ml-1.5 text-xs px-2 py-0.5 rounded-full ${activeTab === 'ready' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                  {scheduledIdeas.length}
                </span>
              </button>
            </div>

            {/* Content View */}
            {activeTab === 'ready' ? (
               // Calendar View for Ready Items
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <ContentCalendar 
                      ideas={scheduledIdeas} 
                      onIdeaClick={(idea) => navigate(`/projects/${id}/ideas/${idea.id}`)} 
                      onReschedule={handleReschedule}
                   />
               </div>
            ) : (
               // Grid View for Concept & Production
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {getActiveList().map(idea => (
                      <IdeaCard 
                        key={idea.id} 
                        idea={idea} 
                        onClick={() => navigate(`/projects/${id}/ideas/${idea.id}`)} 
                        onApprove={() => openApprovalModal(idea)}
                        onRequestChanges={() => openFeedbackModal(idea)}
                        onEdit={() => handleEditIdea(idea)}
                        onDelete={() => handleDeleteIdea(idea.id)}
                        showActions={canManage}
                        clientName={project?.client_name}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedIdeaIds.includes(idea.id)}
                        onToggleSelection={() => toggleSelection(idea.id)}
                      />
                  ))}

                  {getActiveList().length === 0 && (
                      <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50/30 dark:bg-slate-800/30">
                        <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mb-4">
                            <LayoutGrid className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">No content found</h3>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                          {activeTab === 'concept' ? 'Start by creating a new idea draft.' : 'Items will appear here as they progress.'}
                        </p>
                        {activeTab === 'concept' && (
                            <Button onClick={() => { setIdeaToEdit(null); setIsCreateModalOpen(true); }} variant="outline" className="mt-4 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
                              Create First Idea
                            </Button>
                        )}
                      </div>
                  )}
               </div>
            )}
           </>
        )}
      </div>

      <CreateIdeaModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => fetchData(id!)}
        projectId={id!}
        ideaToEdit={ideaToEdit}
        projectContext={project} // Pass project context here
      />

      <ApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onConfirm={handleConfirmApprove}
        isLoading={isActionLoading}
        idea={selectedIdea}
      />

      {/* Bulk Action Modal */}
      <BulkActionModal 
        isOpen={!!bulkAction}
        action={bulkAction || 'approve'}
        count={selectedIdeaIds.length}
        onClose={() => setBulkAction(null)}
        onConfirm={handleBulkConfirm}
        isLoading={isBulkActionLoading}
      />

      {project && (
        <ProjectChatSidebar 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          projectId={project.id}
        />
      )}

      {/* Feedback Modal */}
      {isFeedbackModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Request Changes</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Provide feedback on what needs to be improved.</p>
             <textarea
               className="w-full rounded-md border border-slate-300 dark:border-slate-600 p-3 text-sm focus:ring-2 focus:ring-primary-500 min-h-[120px] mb-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
               placeholder="Enter your feedback here..."
               value={feedbackComment}
               onChange={e => setFeedbackComment(e.target.value)}
               autoFocus
             />
             <div className="flex justify-end gap-2">
               <Button variant="ghost" onClick={() => setIsFeedbackModalOpen(false)}>Cancel</Button>
               <Button 
                 onClick={submitFeedback} 
                 isLoading={isActionLoading}
                 disabled={!feedbackComment.trim()}
                 variant="destructive"
               >
                 Submit Feedback
               </Button>
             </div>
           </div>
         </div>
      )}
    </div>
  );
};
