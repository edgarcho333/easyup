
import React, { useState } from 'react';
import { IdeaAsset, UserRoleName } from '../../types';
import { FileText, Download, Check, X, Video, Image as ImageIcon, Clock, Target } from 'lucide-react';
import { Button } from '../ui/Button';
import { AssetAnnotationModal } from './AssetAnnotationModal';

interface AssetGalleryProps {
  assets: IdeaAsset[];
  onReview: (assetId: string, action: 'approved' | 'changes_requested') => void;
  currentUserRole?: UserRoleName | null;
}

export const AssetGallery: React.FC<AssetGalleryProps> = ({ assets, onReview, currentUserRole }) => {
  const [annotationAsset, setAnnotationAsset] = useState<IdeaAsset | null>(null);
  const canReview = currentUserRole === 'account_manager' || currentUserRole === 'super_admin' || currentUserRole === 'client';

  if (assets.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400">
        <div className="mx-auto w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 border border-slate-200 dark:border-slate-700">
          <FileText className="h-6 w-6 text-slate-300 dark:text-slate-600" />
        </div>
        <p>No assets uploaded yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {assets.map((asset) => (
          <div key={asset.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Preview Area */}
            <div className="aspect-video bg-slate-100 dark:bg-slate-900 relative flex items-center justify-center border-b border-slate-100 dark:border-slate-700 group">
              {asset.file_type.startsWith('image/') ? (
                <img src={asset.file_url} alt={asset.file_name} className="w-full h-full object-cover" />
              ) : asset.file_type.startsWith('video/') ? (
                <div className="flex flex-col items-center text-slate-500 dark:text-slate-400">
                  <Video className="h-12 w-12 mb-2" />
                  <span className="text-xs">Video Preview</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-500 dark:text-slate-400">
                  <FileText className="h-12 w-12 mb-2" />
                  <span className="text-xs">{asset.file_name}</span>
                </div>
              )}
              
              {/* Status Overlay */}
              <div className="absolute top-2 right-2">
                {asset.status === 'approved' && <span className="px-2 py-1 bg-green-500/90 text-white text-xs font-bold rounded-md shadow-sm backdrop-blur-sm">Approved</span>}
                {asset.status === 'changes_requested' && <span className="px-2 py-1 bg-orange-500/90 text-white text-xs font-bold rounded-md shadow-sm backdrop-blur-sm">Changes Requested</span>}
                {asset.status === 'pending_review' && <span className="px-2 py-1 bg-yellow-500/90 text-white text-xs font-bold rounded-md shadow-sm backdrop-blur-sm">Pending Review</span>}
              </div>

               {/* Overlay Actions */}
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[1px]">
                  {/* Only show annotation for images */}
                  {asset.file_type.startsWith('image/') && (
                    <button 
                      onClick={() => setAnnotationAsset(asset)}
                      className="p-3 bg-white dark:bg-slate-800 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-all transform hover:scale-110 shadow-lg" 
                      title="Add Annotation"
                    >
                       <Target className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </button>
                  )}
                  
                  <a 
                    href={asset.file_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-3 bg-white dark:bg-slate-800 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-all transform hover:scale-110 shadow-lg" 
                    title="Download/View"
                  >
                     <Download className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                  </a>
               </div>
            </div>

            {/* Details Area */}
            <div className="p-4">
               <div className="flex justify-between items-start mb-2">
                  <div>
                     <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded border border-slate-200 dark:border-slate-600 uppercase">V{asset.version_number}</span>
                        <h4 className="font-medium text-sm text-slate-900 dark:text-white truncate max-w-[150px]" title={asset.file_name}>{asset.file_name}</h4>
                     </div>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                       By {asset.uploader?.full_name} • {new Date(asset.created_at).toLocaleDateString()}
                     </p>
                  </div>
               </div>

               {asset.notes && (
                 <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-100 dark:border-slate-700 mb-3 italic">
                   "{asset.notes}"
                 </p>
               )}

               {/* Review Actions */}
               {canReview && asset.status === 'pending_review' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                     <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-800" onClick={() => onReview(asset.id, 'changes_requested')}>
                        Reject
                     </Button>
                     <Button size="sm" className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700" onClick={() => onReview(asset.id, 'approved')}>
                        Approve
                     </Button>
                  </div>
               )}
            </div>
          </div>
        ))}
      </div>

      {/* Annotation Modal */}
      <AssetAnnotationModal 
        isOpen={!!annotationAsset} 
        onClose={() => setAnnotationAsset(null)} 
        asset={annotationAsset} 
      />
    </>
  );
};
