import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { budgetService } from '../../services/budgetService';
import { PostCampaign } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, DollarSign, BarChart2, MousePointer, Target, Calendar } from 'lucide-react';

interface AddMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  campaign: PostCampaign | null;
}

export const AddMetricModal: React.FC<AddMetricModalProps> = ({ isOpen, onClose, onSuccess, campaign }) => {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [impressions, setImpressions] = useState('');
  const [clicks, setClicks] = useState('');
  const [spend, setSpend] = useState('');
  const [conversions, setConversions] = useState('');
  const [conversionValue, setConversionValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign || !user) return;

    setIsLoading(true);
    try {
      await budgetService.addMetrics({
        post_campaign_id: campaign.id,
        platform: campaign.platforms[0] || 'facebook', // Simplified: assume primary platform for manual entry
        date,
        impressions: parseInt(impressions) || 0,
        clicks: parseInt(clicks) || 0,
        spend: parseFloat(spend) || 0,
        conversions: parseInt(conversions) || 0,
        conversion_value: parseFloat(conversionValue) || 0
      });
      onSuccess();
      onClose();
      // Reset form
      setImpressions('');
      setClicks('');
      setSpend('');
      setConversions('');
      setConversionValue('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !campaign) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Log Daily Metrics</h3>
            <p className="text-sm text-slate-500">For <span className="font-semibold">{campaign.campaign_name}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">Date</label>
             <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input className="pl-9" type="date" value={date} onChange={e => setDate(e.target.value)} required />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="h-3 w-3" /> Spend
                </label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={spend} onChange={e => setSpend(e.target.value)} />
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <BarChart2 className="h-3 w-3" /> Impressions
                </label>
                <Input type="number" min="0" placeholder="0" value={impressions} onChange={e => setImpressions(e.target.value)} />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <MousePointer className="h-3 w-3" /> Clicks
                </label>
                <Input type="number" min="0" placeholder="0" value={clicks} onChange={e => setClicks(e.target.value)} />
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Target className="h-3 w-3" /> Conversions
                </label>
                <Input type="number" min="0" placeholder="0" value={conversions} onChange={e => setConversions(e.target.value)} />
             </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">Conversion Value (Revenue)</label>
             <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input className="pl-9" type="number" min="0" step="0.01" placeholder="0.00" value={conversionValue} onChange={e => setConversionValue(e.target.value)} />
             </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={isLoading}>Save Metrics</Button>
          </div>
        </form>
      </div>
    </div>
  );
};