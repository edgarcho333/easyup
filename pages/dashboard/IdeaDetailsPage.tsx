
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ideaService } from '../../services/ideaService';
import { assetService } from '../../services/assetService';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { Idea, IdeaComment, IdeaApproval, IdeaAsset, Project, Platform, PostType } from '../../types';
import { 
  Loader2, ArrowLeft, CheckCircle, XCircle, MessageSquare, History, Upload, 
  CheckCircle2, AlertTriangle, Palette, FileText, Send, Eye, ChevronRight, 
  Send as SendIcon, CheckSquare, Layout, Users, DollarSign, Activity, Settings, 
  Lightbulb, Briefcase, Edit2, Sparkles, Copy, Maximize2, Calendar, Share2,
  Instagram, Facebook, Linkedin, Twitter, Video, Image as ImageIcon, Layers
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { IdeaStatusBadge } from '../../components/ideas/IdeaStatusBadge';
import { AssetUploadModal } from '../../components/assets/AssetUploadModal';
import { AssetGallery } from '../../components/assets/AssetGallery';
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal';
import { ProjectChatSidebar } from '../../components/projects/ProjectChatSidebar';
import { CreateIdeaModal } from '../../components/ideas/CreateIdeaModal';

export const IdeaDetailsPage: React.FC = () => {
  const { id, ideaId } = useParams<{ id: string; ideaId: string }>();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [comments, setComments] = useState<IdeaComment[]>([]);
  const [approvals, setApprovals] = useState<IdeaApproval[]>([]);
  const [assets, setAssets] = useState<IdeaAsset[]>([]);
  
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isEditIdeaModalOpen, setIsEditIdeaModalOpen] = useState(false); 
  const [feedbackAction, setFeedbackAction] = useState<'rejected' | 'requested_changes' | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');

  const [activeTab, setActiveTab] = useState<'details' | 'assets'>('details');
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (id && ideaId) fetchData(id, ideaId);
  }, [id, ideaId]);

  const fetchData = async (projectId: string, iid: string) => {
    try {
      const [p, i, c, a, as] = await Promise.all([
        projectService.getProject(projectId),
        ideaService.getIdea(iid),
        ideaService.getComments(iid),
        ideaService.getApprovals(iid),
        assetService.getAssets(iid)
      ]);
      setProject(p);
      setIdea(i);
      setComments(c);
      setApprovals(a);
      setAssets(as);

      if (i.status === 'pending_final_review' || i.status === 'in_production') {
         setActiveTab('assets');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers
  const handleSubmitDraft = async () => {
    if (!idea || !user) return;
    setIsActionLoading(true);
    try {
      await ideaService.updateStatusWithApproval(
        idea.id,
        'pending_approval',
        user.id,
        user.currentRole || 'unknown',
        'approved',
        'Submitted for concept approval'
      );
      addToast('Idea submitted for approval', 'success');
      await fetchData(id!, idea.id);
    } catch (err) {
      console.error(err);
      addToast('Failed to submit', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApproveConcept = async () => {
    if (!idea || !user) return;
    setIsActionLoading(true);
    try {
      await ideaService.updateStatusWithApproval(
        idea.id, 
        'in_production', 
        user.id, 
        user.currentRole || 'unknown',
        'approved',
        'Concept approved. Proceeding to production.'
      );
      
      // Auto-create Task
      const newTask = await taskService.createTask({
        project_id: idea.project_id,
        title: `Design: ${idea.title}`,
        description: `Concept approved. Please create visual assets.\n\nCopy: ${idea.content}`,
        status: 'todo',
        priority: 'high',
        created_by: user.id,
        assigned_to: user.id, 
        due_date: idea.planned_post_date || undefined
      });

      if (idea.reference_image_url) {
         await taskService.addTaskAttachmentFromUrl(newTask.id, idea.reference_image_url, 'Reference Image', user.id);
      }

      addToast('Concept approved! Task created with reference.', 'success');
      await fetchData(id!, idea.id);
    } catch (err) {
      console.error(err);
      addToast('Failed to approve concept', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmitForFinalReview = async () => {
      if (!idea || !user) return;
      if (assets.length === 0) {
          addToast('Please upload at least one asset.', 'error');
          return;
      }
      setIsActionLoading(true);
      try {
          await ideaService.updateStatusWithApproval(
              idea.id,
              'pending_final_review',
              user.id,
              user.currentRole || 'unknown',
              'approved',
              'Assets uploaded. Submitted for final review.'
          );
          addToast('Submitted for final review', 'success');
          await fetchData(id!, idea.id);
      } catch(err) {
          console.error(err);
      } finally {
          setIsActionLoading(false);
      }
  };

  const handleFinalApprove = async () => {
    if (!idea || !user) return;
    setIsActionLoading(true);
    try {
      await ideaService.updateStatusWithApproval(
        idea.id, 
        'scheduled', 
        user.id, 
        user.currentRole || 'unknown',
        'approved',
        'Final visual approved. Scheduled.'
      );
      addToast('Content approved and scheduled!', 'success');
      await fetchData(id!, idea.id);
    } catch (err: any) {
      console.error(err);
      addToast("Failed to approve", 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const openFeedbackModal = (action: 'rejected' | 'requested_changes') => {
    setFeedbackAction(action);
    setFeedbackComment('');
    setIsFeedbackModalOpen(true);
  };

  const submitFeedback = async () => {
    if (!idea || !user || !feedbackAction) return;
    setIsActionLoading(true);
    try {
      const status = feedbackAction === 'rejected' ? 'rejected' : 'changes_requested';
      await ideaService.updateStatusWithApproval(
        idea.id,
        status,
        user.id,
        user.currentRole || 'unknown',
        feedbackAction,
        feedbackComment
      );
      setIsFeedbackModalOpen(false);
      await fetchData(id!, idea.id);
      addToast('Feedback submitted', 'info');
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea || !user || !newComment.trim()) return;
    try {
      await ideaService.addComment(idea.id, user.id, newComment);
      setNewComment('');
      const c = await ideaService.getComments(idea.id);
      setComments(c);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssetReview = async (assetId: string, action: 'approved' | 'changes_requested') => {
    if (!user) return;
    try {
        await assetService.reviewAsset(assetId, user.id, action);
        const updatedAssets = await assetService.getAssets(idea!.id);
        setAssets(updatedAssets);
        addToast(`Asset ${action === 'approved' ? 'approved' : 'rejected'}`, 'info');
    } catch (err) {
        console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Copied to clipboard', 'success');
  };

  // --- Icons & Helpers ---
  const getPlatformIcon = (p: Platform) => {
    switch(p) {
      case 'instagram': return <Instagram className="h-3.5 w-3.5 text-pink-600" />;
      case 'facebook': return <Facebook className="h-3.5 w-3.5 text-blue-600" />;
      case 'linkedin': return <Linkedin className="h-3.5 w-3.5 text-sky-700" />;
      case 'twitter': return <Twitter className="h-3.5 w-3.5 text-sky-500" />;
      case 'tiktok': return <Video className="h-3.5 w-3.5 text-slate-900" />;
      default: return <Share2 className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  const getTypeIcon = (t: PostType) => {
    switch(t) {
      case 'video': case 'reel': return <Video className="h-3.5 w-3.5" />;
      case 'carousel': return <Layers className="h-3.5 w-3.5" />;
      default: return <ImageIcon className="h-3.5 w-3.5" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layout },
    { id: 'content', label: 'Content', icon: Lightbulb },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'budget', label: 'Budget', icon: DollarSign },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleHeaderTabClick = (tabId: string) => {
    if (tabId === 'content') {
        navigate(`/projects/${id}/ideas`);
    } else if (tabId === 'budget') {
        navigate(`/projects/${id}/budget`);
    } else {
        navigate(`/projects/${id}?tab=${tabId}`); // Pass tab query param
    }
  };

  const canManage = user?.currentRole === 'super_admin' || user?.currentRole === 'account_manager';
  const canReview = user?.currentRole === 'account_manager' || user?.currentRole === 'super_admin' || user?.currentRole === 'client';
  const canUpload = user?.currentRole === 'designer' || user?.currentRole === 'content_creator' || user?.currentRole === 'account_manager' || user?.currentRole === 'super_admin';
  
  const isCreator = user?.id === idea?.created_by || canManage;
  const isEditable = (idea?.status === 'draft' || idea?.status === 'changes_requested') && isCreator;

  const steps = [
    { id: 'draft', label: 'Draft', active: idea?.status === 'draft' },
    { id: 'pending_approval', label: 'Concept', active: idea?.status === 'pending_approval' },
    { id: 'production', label: 'Production', active: idea?.status === 'in_production' },
    { id: 'pending_final_review', label: 'Review', active: idea?.status === 'pending_final_review' },
    { id: 'ready', label: 'Ready', active: idea?.status === 'scheduled' || idea?.status === 'published' }
  ];

  const currentStepIndex = steps.findIndex(s => s.active);
  
  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
        
       {/* Unified Command Header */}
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
                    const isActive = tab.id === 'content'; 
                    return (
                       <button
                          key={tab.id}
                          onClick={() => handleHeaderTabClick(tab.id)}
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

       <div className="flex-1 overflow-y-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
         {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
         ) : !idea || !project ? (
            <div className="p-8 text-center text-slate-500">Idea not found</div>
         ) : (
           <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-2 space-y-6">
              {/* Header Content */}
              <div className="shrink-0 flex flex-col gap-4 mb-2">
                  <div className="flex items-center gap-4">
                      <Button variant="ghost" onClick={() => navigate(`/projects/${id}/ideas`)} className="p-2 h-auto rounded-full hover:bg-slate-100 text-slate-500">
                          <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <div className="flex-1">
                          <h1 className="text-2xl font-bold text-slate-900">{idea.title}</h1>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                              <span>{idea.creator?.full_name}</span>
                              <span>•</span>
                              <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                              <span>•</span>
                              <IdeaStatusBadge status={idea.status} />
                          </div>
                      </div>
                      <div className="flex gap-2">
                          
                          {/* Edit Button (Draft Stage) */}
                          {isEditable && (
                             <Button variant="outline" onClick={() => setIsEditIdeaModalOpen(true)} className="border-slate-200 hover:bg-slate-50 text-slate-600">
                                <Edit2 className="h-4 w-4 mr-2" /> Edit
                             </Button>
                          )}

                          {/* Create Task Button */}
                          {(canManage || isCreator) && (
                          <Button variant="outline" onClick={() => setIsCreateTaskModalOpen(true)} className="border-slate-200 hover:bg-slate-50 text-slate-600">
                              <CheckSquare className="h-4 w-4 mr-2" /> Create Task
                          </Button>
                          )}

                          {/* Action Buttons */}
                          {isEditable && (
                          <Button onClick={handleSubmitDraft} isLoading={isActionLoading} className="bg-blue-600 hover:bg-blue-700">
                              <SendIcon className="h-4 w-4 mr-2" /> Submit for Approval
                          </Button>
                          )}

                          {idea.status === 'pending_approval' && canReview && (
                              <>
                              <Button variant="outline" onClick={() => openFeedbackModal('requested_changes')} isLoading={isActionLoading} className="border-red-200 text-red-700 hover:bg-red-50">
                                  <MessageSquare className="h-4 w-4 mr-2" /> Request Changes
                              </Button>
                              <Button onClick={handleApproveConcept} isLoading={isActionLoading} className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200">
                                  <CheckCircle className="h-4 w-4 mr-2" /> Approve Concept
                              </Button>
                              </>
                          )}
                          
                          {idea.status === 'in_production' && canUpload && (
                              <Button onClick={handleSubmitForFinalReview} isLoading={isActionLoading} disabled={assets.length === 0} className="bg-purple-600 hover:bg-purple-700">
                                  <Eye className="h-4 w-4 mr-2" /> Submit Review
                              </Button>
                          )}
                          
                          {idea.status === 'pending_final_review' && canReview && (
                              <>
                                  <Button variant="outline" onClick={() => openFeedbackModal('requested_changes')} isLoading={isActionLoading} className="border-red-200 text-red-700 hover:bg-red-50">
                                  <MessageSquare className="h-4 w-4 mr-2" /> Request Changes
                                  </Button>
                                  <Button onClick={handleFinalApprove} isLoading={isActionLoading} className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200">
                                  <CheckCircle2 className="h-4 w-4 mr-2" /> Final Approve
                                  </Button>
                              </>
                          )}
                      </div>
                  </div>

                  {/* Process Stepper */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden">
                      <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-100 -z-10"></div>
                      {steps.map((step, idx) => {
                          const isCompleted = currentStepIndex > idx || idea.status === 'scheduled' || idea.status === 'published';
                          const isActive = step.active;
                          const isRejected = idea.status === 'changes_requested' || idea.status === 'rejected';
                          
                          return (
                          <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2 z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors shadow-sm
                                  ${isActive 
                                      ? (isRejected ? 'bg-red-100 text-red-600 border-2 border-red-500' : 'bg-primary-600 text-white ring-4 ring-primary-50') 
                                      : isCompleted 
                                          ? 'bg-green-50 text-white' 
                                          : 'bg-slate-100 text-slate-400 border border-slate-200'}
                              `}>
                                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : (idx + 1)}
                              </div>
                              <span className={`text-xs font-medium ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</span>
                          </div>
                          );
                      })}
                  </div>
              </div>

              {/* Tabs */}
              <div className="shrink-0 border-b border-slate-200">
                  <div className="flex space-x-8">
                      <button 
                      onClick={() => setActiveTab('details')}
                      className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'details' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                      >
                      <FileText className="h-4 w-4" />
                      Concept & Details
                      </button>
                      <button 
                      onClick={() => setActiveTab('assets')}
                      className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'assets' ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                      >
                      <Palette className="h-4 w-4" />
                      Visual Assets
                      {assets.length > 0 && <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{assets.length}</span>}
                      </button>
                  </div>
              </div>

              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                  {/* Left Column */}
                  <div className="lg:col-span-2 space-y-6">
                      {activeTab === 'details' && (
                          <div className="space-y-6 animate-in fade-in slide-in-from-left-2">
                            
                            {/* Unified Creative Brief Card */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                               {/* Brief Header */}
                               <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                  <div className="flex items-center gap-2">
                                     <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                                       <Sparkles className="h-4 w-4" />
                                     </div>
                                     <h3 className="font-bold text-slate-900">Creative Brief</h3>
                                  </div>
                                  <div className="text-xs text-slate-400">
                                     Created {new Date(idea.created_at).toLocaleDateString()}
                                  </div>
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                  {/* Left Pane: Visual Reference */}
                                  <div className="p-6 bg-slate-50/30 flex flex-col">
                                     <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visual Reference</h4>
                                        {idea.reference_image_url && (
                                           <a href={idea.reference_image_url} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1">
                                              <Maximize2 className="h-3 w-3" /> Full Size
                                           </a>
                                        )}
                                     </div>
                                     
                                     <div className="flex-1 flex items-center justify-center">
                                        {idea.reference_image_url ? (
                                          <div className="relative group rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white w-full max-w-sm mx-auto">
                                              <img src={idea.reference_image_url} alt="Reference" className="w-full h-auto max-h-[350px] object-cover" />
                                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 backdrop-blur-[1px]">
                                                  <a href={idea.reference_image_url} target="_blank" rel="noreferrer" className="p-2.5 bg-white rounded-full hover:bg-primary-50 transition-colors shadow-lg transform scale-90 group-hover:scale-100">
                                                     <Maximize2 className="h-5 w-5 text-slate-700" />
                                                  </a>
                                              </div>
                                          </div>
                                        ) : (
                                          <div className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm">
                                                 <ImageIcon className="h-5 w-5 text-slate-300" />
                                              </div>
                                              <p className="text-sm font-medium text-slate-500">No reference image provided</p>
                                              <p className="text-xs text-slate-400 mt-1">Visual references help designers understand the vibe.</p>
                                          </div>
                                        )}
                                     </div>
                                  </div>

                                  {/* Right Pane: Copy & Meta */}
                                  <div className="p-6 flex flex-col">
                                     <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Caption / Copy</h4>
                                        <button 
                                          onClick={() => copyToClipboard(idea.content)} 
                                          className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-primary-600 transition-colors bg-slate-100 hover:bg-primary-50 px-2 py-1 rounded-md"
                                        >
                                           <Copy className="h-3 w-3" /> Copy
                                        </button>
                                     </div>
                                     
                                     <div className="flex-1 bg-slate-50 rounded-xl p-5 border border-slate-100 text-sm text-slate-800 whitespace-pre-wrap font-medium leading-relaxed shadow-inner mb-6 min-h-[150px]">
                                        {idea.content || <span className="text-slate-400 italic">No content text provided...</span>}
                                     </div>
                                     
                                     {/* Meta Grid */}
                                     <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                                        <div>
                                           <span className="text-xs text-slate-400 block mb-1.5 uppercase font-semibold tracking-wider">Target Platforms</span>
                                           <div className="flex flex-wrap gap-1.5">
                                              {idea.platforms.map(p => (
                                                 <div key={p} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-xs font-medium text-slate-700 capitalize">
                                                    {getPlatformIcon(p)} {p}
                                                 </div>
                                              ))}
                                           </div>
                                        </div>
                                        
                                        <div>
                                           <span className="text-xs text-slate-400 block mb-1.5 uppercase font-semibold tracking-wider">Format Details</span>
                                           <div className="flex flex-col gap-1.5">
                                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                                 <span className="p-1 bg-slate-100 rounded">{getTypeIcon(idea.post_type)}</span>
                                                 <span className="capitalize font-medium">{idea.post_type}</span>
                                              </div>
                                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                                 <span className="p-1 bg-slate-100 rounded"><Calendar className="h-3.5 w-3.5" /></span>
                                                 <span className="font-medium">{idea.planned_post_date ? new Date(idea.planned_post_date).toLocaleDateString() : 'No Date Set'}</span>
                                              </div>
                                           </div>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            </div>
                          
                          {/* Approval History */}
                          <Card>
                              <CardHeader className="pb-2 border-b border-slate-100">
                              <CardTitle className="flex items-center gap-2">
                                  <History className="h-4 w-4" /> Activity & Approvals
                              </CardTitle>
                              </CardHeader>
                              <CardContent className="pt-4 space-y-4">
                              {approvals.length === 0 ? (
                                  <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                      No approvals or reviews recorded yet.
                                  </div>
                              ) : (
                                  approvals.map((approval) => (
                                  <div key={approval.id} className="flex gap-3 items-start">
                                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1 ${
                                      approval.action === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                      }`}>
                                      {approval.action === 'approved' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                      </div>
                                      <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                      <div className="flex items-center justify-between mb-1">
                                          <p className="text-sm font-bold text-slate-900">{approval.approver?.full_name}</p>
                                          <span className="text-xs text-slate-400">{new Date(approval.created_at).toLocaleString()}</span>
                                      </div>
                                      <div className="text-xs text-slate-500 mb-2 capitalize flex items-center gap-1">
                                          <span className="font-medium">{approval.approver_role.replace('_', ' ')}</span> 
                                          <span>•</span>
                                          <span>{approval.action.replace('_', ' ')}</span>
                                      </div>
                                      {approval.comments && (
                                          <div className="text-sm text-slate-700">
                                          "{approval.comments}"
                                          </div>
                                      )}
                                      </div>
                                  </div>
                                  ))
                              )}
                              </CardContent>
                          </Card>
                          </div>
                      )}

                      {activeTab === 'assets' && (
                          <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                          {idea.status === 'pending_approval' || idea.status === 'draft' ? (
                              <div className="p-10 text-center bg-amber-50 rounded-xl border border-amber-200">
                                  <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                                  <h3 className="font-bold text-amber-800">Concept Not Approved</h3>
                                  <p className="text-amber-700 text-sm mt-1">Please approve the concept before managing visual assets.</p>
                              </div>
                          ) : (
                              <>
                                  <div className="flex justify-between items-center bg-purple-50 p-4 rounded-xl border border-purple-100">
                                      <div>
                                      <h2 className="text-lg font-bold text-purple-900">Visual Assets</h2>
                                      <p className="text-sm text-purple-700">Manage final designs/videos.</p>
                                      </div>
                                      {canUpload && (
                                      <Button onClick={() => setIsUploadModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 border-transparent shadow-sm">
                                          <Upload className="h-4 w-4 mr-2" /> Upload Asset
                                      </Button>
                                      )}
                                  </div>
                                  
                                  <AssetGallery 
                                  assets={assets} 
                                  onReview={handleAssetReview}
                                  currentUserRole={user?.currentRole}
                                  />
                              </>
                          )}
                          </div>
                      )}
                  </div>

                  {/* Right Column: Chat */}
                  <div className="space-y-6 h-full flex flex-col">
                      <Card className="h-auto max-h-[600px] flex flex-col border-slate-200 shadow-sm">
                          <div className="p-4 border-b border-slate-100 font-bold text-slate-800 flex items-center justify-between bg-slate-50/50">
                             <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" /> Discussion
                             </div>
                          </div>
                          <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-white min-h-[200px]">
                          {comments.length === 0 && (
                              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                                  <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                                  <p className="text-sm">No comments yet.</p>
                              </div>
                          )}
                          {comments.map(comment => (
                              <div key={comment.id} className={`flex gap-3 ${comment.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                                  <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold shrink-0 text-slate-600">
                                      {comment.user?.full_name?.[0]}
                                  </div>
                                  <div className={`flex flex-col ${comment.user_id === user?.id ? 'items-end' : 'items-start'} max-w-[85%]`}>
                                      <div className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${
                                      comment.user_id === user?.id 
                                          ? 'bg-primary-600 text-white rounded-tr-none' 
                                          : 'bg-slate-100 text-slate-700 rounded-tl-none'
                                      }`}>
                                      {comment.content}
                                      </div>
                                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                                      {new Date(comment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </span>
                                  </div>
                              </div>
                          ))}
                          </div>
                          <div className="p-3 border-t border-slate-200 bg-slate-50">
                          <form onSubmit={handlePostComment} className="flex gap-2">
                              <input 
                                  className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
                                  placeholder="Type a message..."
                                  value={newComment}
                                  onChange={e => setNewComment(e.target.value)}
                              />
                              <Button size="icon" className="rounded-full h-9 w-9 shrink-0 shadow-sm" type="submit" disabled={!newComment.trim()}>
                                  <Send className="h-4 w-4" />
                              </Button>
                          </form>
                          </div>
                      </Card>
                  </div>
              </div>
           </div>
         )}
       </div>

       {/* Modals */}
       {isFeedbackModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
             <h3 className="text-lg font-bold text-slate-900 mb-2">
               {feedbackAction === 'rejected' ? 'Reject Content' : 'Request Changes'}
             </h3>
             <textarea
               className="w-full rounded-md border border-slate-300 p-3 text-sm focus:ring-2 focus:ring-primary-500 min-h-[120px] mb-4"
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
                 variant={feedbackAction === 'rejected' ? 'destructive' : 'primary'}
                 disabled={!feedbackComment.trim()}
               >
                 Submit Feedback
               </Button>
             </div>
           </div>
         </div>
       )}

       {idea && (
         <>
            <AssetUploadModal 
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={() => fetchData(id!, idea.id)}
                ideaId={idea.id}
            />

            {/* Edit Idea Modal */}
            <CreateIdeaModal
                isOpen={isEditIdeaModalOpen}
                onClose={() => setIsEditIdeaModalOpen(false)}
                onSuccess={() => { fetchData(id!, idea.id); addToast('Idea updated successfully', 'success'); }}
                projectId={idea.project_id}
                ideaToEdit={idea}
            />

            {/* Manual Task Creation */}
            <CreateTaskModal
                isOpen={isCreateTaskModalOpen}
                onClose={() => setIsCreateTaskModalOpen(false)}
                onSuccess={() => { addToast('Task created from idea', 'success'); }}
                projectId={idea.project_id}
                initialData={{
                    title: `Production: ${idea.title}`,
                    description: `${idea.content}\n\n---\n**Specs**\nPlatform: ${idea.platforms.join(', ')}\nType: ${idea.post_type}`
                }}
                // Pass the reference image or the latest asset if available
                initialAttachments={
                   idea.reference_image_url 
                     ? [idea.reference_image_url] 
                     : assets.length > 0 ? [assets[0].file_url] : []
                }
            />
         </>
       )}

       {project && (
         <ProjectChatSidebar 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          projectId={project.id}
         />
       )}
    </div>
  );
}
