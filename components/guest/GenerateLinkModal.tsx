
import React, { useState } from 'react';
import { guestLinkService } from '../../services/guestLinkService';
import { Idea } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Link as LinkIcon, Copy, Check, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface GenerateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIdeas: Idea[];
  projectId: string;
}

export const GenerateLinkModal: React.FC<GenerateLinkModalProps> = ({ isOpen, onClose, selectedIdeas, projectId }) => {
  const { user } = useAuth();
  const [clientName, setClientName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [expiresDays, setExpiresDays] = useState('7');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!user?.currentOrganization) return;
    setIsLoading(true);

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresDays));

      const link = await guestLinkService.createLink(
        projectId,
        user.currentOrganization.id,
        user.id,
        selectedIdeas.map(i => i.id),
        {
          clientName,
          instructions,
          expiresAt: expiresAt.toISOString()
        }
      );

      // Generate full URL
      const url = `${window.location.origin}/#/approve/${link.token}`;
      setGeneratedLink(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900">Generate Approval Link</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {generatedLink ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <Globe className="h-7 w-7 text-green-600" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900">Link Ready!</h4>
                <p className="text-slate-500 mt-2">
                   Share this link with <strong>{clientName || 'your client'}</strong> to approve {selectedIdeas.length} items.
                </p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-left flex gap-2 items-center">
                 <Input readOnly value={generatedLink} className="bg-white font-mono text-xs" />
                 <Button onClick={handleCopy} size="icon" variant="outline" className="shrink-0">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                 </Button>
              </div>

              <Button onClick={onClose} className="w-full">Done</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-blue-800 text-sm">
                You selected <strong>{selectedIdeas.length} ideas</strong> to share for approval.
              </div>

              <Input 
                label="Client Name (Optional)" 
                placeholder="e.g. Acme Corp Team" 
                value={clientName}
                onChange={e => setClientName(e.target.value)}
              />

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Instructions</label>
                <textarea 
                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                  placeholder="Please review these posts for the upcoming campaign..."
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Link Expires In</label>
                <select 
                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                  value={expiresDays}
                  onChange={e => setExpiresDays(e.target.value)}
                >
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                  <option value="365">1 Year</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button onClick={handleGenerate} isLoading={isLoading}>
                  <LinkIcon className="h-4 w-4 mr-2" /> Generate Link
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
