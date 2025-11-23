
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ideaService } from '../../services/ideaService';
import { Idea, Platform, PostType } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Image, Video, Layers, Instagram, Facebook, Linkedin, Twitter, Upload, Check, Save } from 'lucide-react';

interface CreateIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  ideaToEdit?: Idea | null; // Added for Edit Mode
}

const PLATFORMS: { id: Platform; label: string; icon: any }[] = [
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'facebook', label: 'Facebook', icon: Facebook },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'twitter', label: 'Twitter', icon: Twitter },
  { id: 'tiktok', label: 'TikTok', icon: Video },
];

const POST_TYPES: { id: PostType; label: string; icon: any }[] = [
  { id: 'image', label: 'Image', icon: Image },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'carousel', label: 'Carousel', icon: Layers },
  { id: 'reel', label: 'Reel', icon: Video },
  { id: 'story', label: 'Story', icon: Image },
];

export const CreateIdeaModal: React.FC<CreateIdeaModalProps> = ({ isOpen, onClose, onSuccess, projectId, ideaToEdit }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('image');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [date, setDate] = useState('');
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [existingReferenceUrl, setExistingReferenceUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      if (ideaToEdit) {
        // Edit Mode: Populate fields
        setTitle(ideaToEdit.title);
        setContent(ideaToEdit.content);
        setPostType(ideaToEdit.post_type);
        setPlatforms(ideaToEdit.platforms);
        setDate(ideaToEdit.planned_post_date || '');
        setExistingReferenceUrl(ideaToEdit.reference_image_url);
        setReferenceFile(null);
      } else {
        // Create Mode: Reset
        setTitle('');
        setContent('');
        setPostType('image');
        setPlatforms([]);
        setDate('');
        setReferenceFile(null);
        setExistingReferenceUrl(undefined);
      }
      setError('');
    }
  }, [isOpen, ideaToEdit]);

  const togglePlatform = (p: Platform) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(i => i !== p) : [...prev, p]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReferenceFile(e.target.files[0]);
      setExistingReferenceUrl(undefined); // Clear existing if new file chosen
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      let referenceImageUrl = existingReferenceUrl;
      if (referenceFile) {
        // For mock mode, we create a blob URL to simulate an uploaded file URL
        referenceImageUrl = URL.createObjectURL(referenceFile);
      }

      const ideaData = {
        project_id: projectId,
        title,
        content,
        post_type: postType,
        platforms,
        planned_post_date: date || undefined,
        reference_image_url: referenceImageUrl
      };

      if (ideaToEdit) {
        await ideaService.updateIdea(ideaToEdit.id, ideaData);
      } else {
        await ideaService.createIdea({
          ...ideaData,
          created_by: user.id,
          status: 'draft',
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save idea");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isEditing = !!ideaToEdit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900">
            {isEditing ? 'Edit Idea' : 'Create New Idea'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
              {error}
            </div>
          )}

          <form id="idea-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Title"
                placeholder="e.g. Summer Sale Announcement"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Post Type</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {POST_TYPES.map(type => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setPostType(type.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition-all ${
                          postType === type.id 
                            ? 'border-primary-500 bg-primary-50 text-primary-700' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <Icon className="h-5 w-5 mb-1" />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => {
                    const Icon = p.icon;
                    const isSelected = platforms.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlatform(p.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                 <label className="text-sm font-medium text-slate-700 mb-1 block">Content / Caption</label>
                 <textarea 
                   className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:outline-none min-h-[120px] resize-y placeholder:text-slate-400"
                   placeholder="Write your post caption here..."
                   value={content}
                   onChange={e => setContent(e.target.value)}
                   required
                 />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <Input
                   type="date"
                   label="Planned Date"
                   value={date}
                   onChange={e => setDate(e.target.value)}
                   className="bg-white text-slate-900"
                 />
                 <div className="space-y-1">
                   <label className="text-sm font-medium text-slate-700">Reference Image</label>
                   <div className={`relative flex items-center justify-center w-full h-10 px-3 rounded-md border transition-colors cursor-pointer
                     ${referenceFile || existingReferenceUrl ? 'border-primary-200 bg-primary-50 text-primary-700' : 'border-dashed border-slate-300 hover:bg-slate-50 text-slate-500 bg-white'}`}>
                     <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                     />
                     {referenceFile ? (
                       <div className="flex items-center gap-2 truncate">
                         <Check className="h-4 w-4 shrink-0" />
                         <span className="truncate text-sm font-medium">{referenceFile.name}</span>
                       </div>
                     ) : existingReferenceUrl ? (
                       <div className="flex items-center gap-2 truncate">
                         <Image className="h-4 w-4 shrink-0" />
                         <span className="truncate text-sm font-medium">Current Reference Image</span>
                       </div>
                     ) : (
                       <div className="flex items-center gap-2">
                         <Upload className="h-4 w-4" /> 
                         <span className="text-sm">Upload Image</span>
                       </div>
                     )}
                   </div>
                 </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button form="idea-form" type="submit" isLoading={isLoading}>
            {isEditing ? <><Save className="mr-2 h-4 w-4"/> Save Changes</> : 'Save Draft'}
          </Button>
        </div>
      </div>
    </div>
  );
};
