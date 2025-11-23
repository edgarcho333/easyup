import React, { useState } from 'react';
import { budgetService } from '../../services/budgetService';
import { Platform } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, DollarSign, Megaphone, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({ isOpen, onClose, onSuccess, projectId }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [startDate, setStartDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePlatformToggle = (p: Platform) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(i => i !== p) : [...prev, p]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      await budgetService.createCampaign({
        project_id: projectId,
        campaign_name: name,
        budget_allocated: parseFloat(budget),
        budget_spent: 0,
        platforms,
        start_date: startDate,
        status: 'planned',
        created_by: user.id
      });
      onSuccess();
      onClose();
      setName('');
      setBudget('');
      setPlatforms([]);
      setStartDate('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
             <h3 className="text-xl font-bold text-slate-900">New Campaign</h3>
             <p className="text-sm text-slate-500">Set up tracking for paid media.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500"><X className="h-6 w-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campaign Name</label>
             <div className="relative">
               <Megaphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
               <Input className="pl-9" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Summer Sale Promo" />
             </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Budget</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input className="pl-9" type="number" value={budget} onChange={e => setBudget(e.target.value)} required placeholder="0.00" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {['facebook', 'instagram', 'linkedin', 'tiktok', 'twitter'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePlatformToggle(p as Platform)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-all ${platforms.includes(p as Platform) ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-105' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
             <div className="relative">
               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
               <Input className="pl-9" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
            <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" isLoading={isLoading}>Create Campaign</Button>
          </div>
        </form>
      </div>
    </div>
  );
};