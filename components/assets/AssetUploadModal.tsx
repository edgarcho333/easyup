
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { assetService } from '../../services/assetService';
import { Button } from '../ui/Button';
import { X, Upload, FileText, CheckCircle } from 'lucide-react';

interface AssetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ideaId: string;
}

export const AssetUploadModal: React.FC<AssetUploadModalProps> = ({ isOpen, onClose, onSuccess, ideaId }) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) return;

    setIsLoading(true);
    setError('');

    try {
      await assetService.uploadAsset(ideaId, file, user.id, notes);
      onSuccess();
      onClose();
      setFile(null);
      setNotes('');
    } catch (err: any) {
      setError(err.message || "Failed to upload asset");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900">Upload Asset</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">File</label>
            <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${file ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-primary-400'}`}>
              <input 
                type="file" 
                id="asset-file" 
                className="hidden" 
                onChange={handleFileChange}
                accept="image/*,video/*"
              />
              <label htmlFor="asset-file" className="cursor-pointer flex flex-col items-center">
                {file ? (
                  <>
                    <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                    <span className="text-sm font-medium text-green-700">{file.name}</span>
                    <span className="text-xs text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-slate-600">Click to upload image or video</span>
                    <span className="text-xs text-slate-400 mt-1">Max 20MB</span>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Notes (Optional)</label>
            <textarea
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 min-h-[80px]"
              placeholder="e.g. Updated color scheme based on feedback..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="pt-2 flex gap-3">
            <Button variant="ghost" type="button" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" isLoading={isLoading} disabled={!file} className="flex-1">Upload</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
