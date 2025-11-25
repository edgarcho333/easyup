
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { assetService } from '../../services/assetService';
import { IdeaAsset, AssetAnnotation } from '../../types';
import { X, Check, Trash2, MessageSquare, CheckCircle2, Target, Loader2, Send } from 'lucide-react';
import { Button } from '../ui/Button';

interface AssetAnnotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: IdeaAsset | null;
}

export const AssetAnnotationModal: React.FC<AssetAnnotationModalProps> = ({ isOpen, onClose, asset }) => {
  const { user } = useAuth();
  const [annotations, setAnnotations] = useState<AssetAnnotation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New Annotation State
  const [pendingPoint, setPendingPoint] = useState<{x: number, y: number} | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showResolved, setShowResolved] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isOpen && asset) {
      fetchAnnotations();
    } else {
        // Reset
        setAnnotations([]);
        setPendingPoint(null);
        setCommentText('');
    }
  }, [isOpen, asset]);

  const fetchAnnotations = async () => {
    if (!asset) return;
    setIsLoading(true);
    try {
      const data = await assetService.getAnnotations(asset.id);
      setAnnotations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    
    // Prevent placing a new point if we are clicking an existing one (handled by bubbling, but good to be safe)
    if ((e.target as HTMLElement).closest('.annotation-dot')) return;

    const rect = imageRef.current.getBoundingClientRect();
    
    // Calculate percentage coordinates
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPendingPoint({ x, y });
    // Focus input automatically would be nice here
  };

  const handleSubmitAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPoint || !user || !asset || !commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await assetService.addAnnotation(asset.id, user.id, pendingPoint.x, pendingPoint.y, commentText);
      setPendingPoint(null);
      setCommentText('');
      fetchAnnotations();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await assetService.resolveAnnotation(id);
      fetchAnnotations();
    } catch (err) {
        console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Delete this comment?")) return;
      try {
          await assetService.deleteAnnotation(id);
          fetchAnnotations();
      } catch (err) { console.error(err); }
  }

  if (!isOpen || !asset) return null;

  const activeAnnotations = annotations.filter(a => showResolved || !a.is_resolved);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full h-full max-w-7xl flex flex-col md:flex-row overflow-hidden rounded-xl bg-slate-900 shadow-2xl border border-slate-800">
        
        {/* Main Canvas Area */}
        <div className="flex-1 relative flex items-center justify-center bg-black/50 overflow-hidden group cursor-crosshair" onClick={() => setPendingPoint(null)}>
           
           {/* Toolbar Overlay */}
           <div className="absolute top-4 left-4 z-20 flex gap-2" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setShowResolved(!showResolved)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-2
                    ${showResolved 
                        ? 'bg-primary-600 border-primary-600 text-white' 
                        : 'bg-black/50 border-white/20 text-white hover:bg-black/70'}`}
              >
                 <CheckCircle2 className="h-3.5 w-3.5" /> Show Resolved
              </button>
           </div>

           <div className="relative inline-block max-h-full max-w-full p-4" onClick={e => e.stopPropagation()}>
              {/* The Image */}
              <div className="relative shadow-2xl" onClick={handleImageClick}>
                  <img 
                    ref={imageRef}
                    src={asset.file_url} 
                    alt="Asset" 
                    className="max-h-[85vh] max-w-full object-contain rounded-sm select-none" 
                    draggable={false}
                  />

                  {/* Existing Annotations */}
                  {activeAnnotations.map((ann, idx) => (
                      <div
                        key={ann.id}
                        className="annotation-dot absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center rounded-full border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-110 group/dot z-10"
                        style={{ 
                            left: `${ann.x}%`, 
                            top: `${ann.y}%`,
                            backgroundColor: ann.is_resolved ? '#10b981' : '#ef4444' // Green if resolved, Red if open
                        }}
                      >
                         <span className="text-white font-bold text-xs">{idx + 1}</span>
                         
                         {/* Tooltip / Popover on Hover */}
                         <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl p-3 border border-slate-200 dark:border-slate-700 opacity-0 group-hover/dot:opacity-100 pointer-events-none group-hover/dot:pointer-events-auto transition-opacity z-50 origin-left scale-95 group-hover/dot:scale-100">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{ann.user?.full_name}</span>
                                <span className="text-[10px] text-slate-400">{new Date(ann.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{ann.comment}</p>
                            {!ann.is_resolved && (
                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                    {user?.id === ann.user_id && (
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(ann.id); }} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); handleResolve(ann.id); }} className="flex items-center gap-1 text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                                        <Check className="h-3 w-3" /> Resolve
                                    </button>
                                </div>
                            )}
                         </div>
                      </div>
                  ))}

                  {/* Pending Point Form */}
                  {pendingPoint && (
                      <div 
                        className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-white border-4 border-blue-500 shadow-lg z-20 animate-pulse"
                        style={{ left: `${pendingPoint.x}%`, top: `${pendingPoint.y}%` }}
                      >
                         <div className="absolute left-6 top-0 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl p-3 border border-slate-200 dark:border-slate-700 origin-top-left animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Add Comment</h4>
                            <form onSubmit={handleSubmitAnnotation}>
                                <textarea 
                                    className="w-full text-sm p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 min-h-[60px] mb-2"
                                    placeholder="What needs to be changed?"
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <Button type="button" size="sm" variant="ghost" onClick={() => setPendingPoint(null)} className="h-7 text-xs dark:text-slate-300">Cancel</Button>
                                    <Button type="submit" size="sm" className="h-7 text-xs" isLoading={isSubmitting} disabled={!commentText.trim()}>
                                        <Send className="h-3 w-3 mr-1" /> Post
                                    </Button>
                                </div>
                            </form>
                         </div>
                      </div>
                  )}
              </div>
           </div>
        </div>

        {/* Sidebar (Comments List) */}
        <div className="w-full md:w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-slate-500" /> Comments
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{annotations.length} annotations</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                {isLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
                ) : annotations.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                        <Target className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">Click anywhere on the image to leave a comment.</p>
                    </div>
                ) : (
                    annotations.map((ann, idx) => (
                        <div 
                            key={ann.id} 
                            className={`p-3 rounded-lg border transition-all relative group ${
                                ann.is_resolved 
                                    ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-75' 
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary-300 dark:hover:border-primary-600'
                            }`}
                        >
                            <div className="flex gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white ${ann.is_resolved ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">{ann.user?.full_name}</span>
                                        <span className="text-[10px] text-slate-400">{new Date(ann.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className={`text-sm mb-2 ${ann.is_resolved ? 'text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'}`}>{ann.comment}</p>
                                    
                                    {!ann.is_resolved ? (
                                        <button 
                                            onClick={() => handleResolve(ann.id)}
                                            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-green-600 dark:text-slate-400 dark:hover:text-green-400 transition-colors"
                                        >
                                            <CheckCircle2 className="h-3 w-3" /> Mark Resolved
                                        </button>
                                    ) : (
                                        <span className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
                                            <Check className="h-3 w-3" /> Resolved
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
