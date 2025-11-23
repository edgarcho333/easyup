
import React from 'react';
import { Idea } from '../../types';
import { 
  Video, 
  Image as ImageIcon, 
  ArrowRight, 
  CheckCircle2, 
  MessageSquare, 
  Heart, 
  Share2, 
  MoreHorizontal, 
  ThumbsUp, 
  Globe, 
  Bookmark, 
  MessageCircle,
  Check
} from 'lucide-react';
import { IdeaStatusBadge } from './IdeaStatusBadge';
import { Button } from '../ui/Button';

interface IdeaCardProps {
  idea: Idea;
  onClick: () => void;
  onApprove?: () => void;
  onRequestChanges?: () => void;
  showActions?: boolean;
  clientName?: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({ 
  idea, 
  onClick, 
  onApprove, 
  onRequestChanges, 
  showActions = false, 
  clientName,
  isSelectionMode,
  isSelected,
  onToggleSelection
}) => {
  
  // Determine primary platform to style against
  const platform = idea.platforms[0] || 'facebook';
  
  // Facebook, LinkedIn, Twitter usually put Text BEFORE Media
  // Instagram, TikTok usually put Text AFTER Media
  const isTextFirst = ['facebook', 'linkedin', 'twitter'].includes(platform);
  const isInstagram = platform === 'instagram';

  const hasAssets = idea.assets && idea.assets.length > 0;
  const latestAsset = hasAssets ? idea.assets![0] : null;
  
  // Logic: Use asset if available, otherwise reference image, otherwise placeholder
  const mediaUrl = latestAsset ? latestAsset.file_url : idea.reference_image_url;
  const isReference = !latestAsset && !!idea.reference_image_url;
  const isVideo = latestAsset?.file_type.includes('video') || idea.post_type === 'video' || idea.post_type === 'reel';

  const isApprovalPending = idea.status === 'pending_approval' || idea.status === 'pending_final_review';
  const showButtons = showActions && isApprovalPending && onApprove && onRequestChanges && !isSelectionMode;

  const handleCardClick = (e: React.MouseEvent) => {
    if (isSelectionMode && onToggleSelection) {
      e.preventDefault();
      e.stopPropagation();
      onToggleSelection();
    } else {
      onClick();
    }
  };

  // --- Components for Layout Parts ---

  const PostHeader = () => (
    <div className="flex items-center justify-between px-4 pt-4 pb-2">
      <div className="flex items-center gap-2.5">
        {/* Avatar */}
        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-bold
           ${platform === 'instagram' ? 'bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]' : ''}
        `}>
           <div className="h-full w-full bg-slate-200 rounded-full border-2 border-white flex items-center justify-center overflow-hidden">
             {idea.creator?.avatar_url ? (
               <img src={idea.creator.avatar_url} alt="" className="h-full w-full object-cover" />
             ) : (
               <span className="text-slate-500 text-xs">{clientName?.[0] || idea.creator?.full_name?.[0]}</span>
             )}
           </div>
        </div>
        
        {/* Name & Meta */}
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 leading-tight">
             {clientName || idea.creator?.full_name || 'Company Name'}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
             {!isInstagram && (
               <>
                 <span>{idea.planned_post_date ? new Date(idea.planned_post_date).toLocaleDateString() : 'Just now'}</span>
                 <span>•</span>
                 <Globe className="h-3 w-3" />
               </>
             )}
             {isInstagram && <span>Suggested for you</span>}
          </div>
        </div>
      </div>
      <MoreHorizontal className="h-5 w-5 text-slate-500 cursor-pointer" />
    </div>
  );

  const PostContentText = () => (
    <div className={`px-4 ${isTextFirst ? 'pb-2' : 'pt-2 pb-4'}`}>
       {/* Instagram puts username before caption */}
       {!isTextFirst && (
         <span className="font-bold text-sm mr-2 text-slate-900">
           {clientName || idea.creator?.full_name}
         </span>
       )}
       <span className="text-sm text-slate-800 whitespace-pre-wrap font-normal leading-relaxed">
          {idea.content || <span className="text-slate-400 italic">No content written yet...</span>}
       </span>
       <div className="mt-1 flex flex-wrap gap-1">
         {idea.platforms.map(p => (
            <span key={p} className="text-blue-600 text-xs hover:underline">#{p}</span>
         ))}
       </div>
    </div>
  );

  const PostMedia = () => (
    <div className="w-full bg-slate-100 relative group/media overflow-hidden border-y border-slate-100">
       {/* Aspect Ratio Container */}
       <div className={`${isInstagram ? 'aspect-square' : 'aspect-video'} relative flex items-center justify-center bg-slate-50`}>
          {mediaUrl ? (
             isVideo ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 relative">
                   {/* Mock Video Player Look */}
                   <img src={mediaUrl} alt="Video Thumbnail" className="w-full h-full object-cover opacity-60" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                         <Video className="h-6 w-6 text-white fill-white" />
                      </div>
                   </div>
                </div>
             ) : (
                <img src={mediaUrl} alt="Post Asset" className="w-full h-full object-cover" />
             )
          ) : (
             // Placeholder for concept
             <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center text-slate-400 select-none">
                <ImageIcon className="h-10 w-10 mb-2 opacity-20" />
                <span className="text-xs font-medium uppercase tracking-widest opacity-40">Visual Placeholder</span>
             </div>
          )}

          {/* Reference Badge */}
          {isReference && (
            <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md uppercase tracking-wider z-10 shadow-sm border border-white/10">
              Reference Only
            </div>
          )}
       </div>
    </div>
  );

  const PostEngagementBar = () => (
    <div className="px-4 py-3">
       {isInstagram ? (
         // Insta Style
         <div className="flex justify-between items-center mb-2">
            <div className="flex gap-4 text-slate-800">
               <Heart className="h-6 w-6 hover:text-red-500 transition-colors cursor-pointer" />
               <MessageCircle className="h-6 w-6 hover:text-slate-600 transition-colors cursor-pointer" />
               <Share2 className="h-6 w-6 hover:text-slate-600 transition-colors cursor-pointer" />
            </div>
            <Bookmark className="h-6 w-6 text-slate-800 hover:text-slate-600 transition-colors cursor-pointer" />
         </div>
       ) : (
         // Facebook Style
         <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-1">
             <button className="flex items-center gap-2 text-slate-500 hover:bg-slate-50 px-4 py-1 rounded-md transition-colors flex-1 justify-center">
                <ThumbsUp className="h-5 w-5" /> <span className="text-sm font-medium">Like</span>
             </button>
             <button className="flex items-center gap-2 text-slate-500 hover:bg-slate-50 px-4 py-1 rounded-md transition-colors flex-1 justify-center">
                <MessageSquare className="h-5 w-5" /> <span className="text-sm font-medium">Comment</span>
             </button>
             <button className="flex items-center gap-2 text-slate-500 hover:bg-slate-50 px-4 py-1 rounded-md transition-colors flex-1 justify-center">
                <Share2 className="h-5 w-5" /> <span className="text-sm font-medium">Share</span>
             </button>
         </div>
       )}
       
       {/* Likes Count Mockup */}
       {isInstagram && (
         <div className="text-sm font-bold text-slate-900">1,234 likes</div>
       )}
    </div>
  );

  return (
    <div 
      className={`group bg-white rounded-xl border shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 cursor-pointer flex flex-col h-full overflow-hidden relative
        ${isSelected ? 'border-primary-500 ring-1 ring-primary-500' : 'border-slate-200'}
      `}
      onClick={handleCardClick}
    >
      {/* Selection Checkbox Overlay */}
      {isSelectionMode && (
        <div className="absolute top-3 left-3 z-30 animate-in fade-in zoom-in duration-200">
           <div className={`h-6 w-6 rounded-md border flex items-center justify-center transition-all shadow-sm ${isSelected ? 'bg-primary-600 border-primary-600' : 'bg-white border-slate-300 hover:border-primary-400'}`}>
              {isSelected && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
           </div>
        </div>
      )}

      {/* Status Badge Overlay - Floating above everything */}
      <div className="absolute top-3 right-3 z-20 pointer-events-none">
         <div className="shadow-sm">
           <IdeaStatusBadge status={idea.status} />
         </div>
      </div>

      {/* --- Social Post Simulation Wrapper --- */}
      <div className={`flex-1 flex flex-col pb-2 ${isSelectionMode && !isSelected ? 'opacity-90' : ''}`}>
         
         {/* Header */}
         <PostHeader />

         {/* Content Flow based on Platform */}
         {isTextFirst ? (
            <>
              <PostContentText />
              <PostMedia />
              <PostEngagementBar />
            </>
         ) : (
            <>
              <PostMedia />
              <PostEngagementBar />
              <PostContentText />
            </>
         )}
         
      </div>

      {/* --- Real Dashboard Actions (Sticky Bottom) --- */}
      {!isSelectionMode && (
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex gap-2">
           {showButtons ? (
               <>
                 <Button 
                   variant="outline" 
                   size="sm" 
                   className="flex-1 h-9 text-xs px-0 border-slate-200 text-slate-600 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 bg-white" 
                   onClick={(e) => { e.stopPropagation(); onRequestChanges!(); }}
                 >
                   <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Changes
                 </Button>
                 <Button 
                   size="sm" 
                   className="flex-1 h-9 text-xs px-0 bg-green-600 hover:bg-green-700 text-white shadow-sm border-transparent" 
                   onClick={(e) => { e.stopPropagation(); onApprove!(); }}
                 >
                   <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Approve
                 </Button>
               </>
             ) : (
               <Button 
                 variant="ghost"
                 size="sm"
                 className="w-full h-9 text-xs text-slate-500 hover:text-primary-600 hover:bg-white border border-transparent hover:border-slate-200"
                 onClick={(e) => { e.stopPropagation(); onClick(); }}
               >
                  Open Details <ArrowRight className="h-3.5 w-3.5 ml-1" />
               </Button>
             )}
        </div>
      )}
    </div>
  );
};
