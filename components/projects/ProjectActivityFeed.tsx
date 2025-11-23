
import React, { useState, useEffect } from 'react';
import { ActivityLog } from '../../types';
import { analyticsService } from '../../services/analyticsService';
import { 
  Loader2, 
  MessageSquare, 
  CheckCircle2, 
  Plus,
  FileText, 
  Trash2, 
  User, 
  Filter,
  Briefcase,
  Upload,
  ArrowRightLeft,
  AlertCircle,
  Calendar
} from 'lucide-react';

interface ProjectActivityFeedProps {
  projectId: string;
}

type FilterType = 'all' | 'staff' | 'client';

export const ProjectActivityFeed: React.FC<ProjectActivityFeedProps> = ({ projectId }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    fetchLogs();
  }, [projectId]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await analyticsService.getProjectActivityLogs(projectId);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('create') || t.includes('add')) return <Plus className="h-4 w-4" />;
    if (t.includes('approve')) return <CheckCircle2 className="h-4 w-4" />;
    if (t.includes('reject') || t.includes('request')) return <AlertCircle className="h-4 w-4" />;
    if (t.includes('comment')) return <MessageSquare className="h-4 w-4" />;
    if (t.includes('delete') || t.includes('remove')) return <Trash2 className="h-4 w-4" />;
    if (t.includes('upload')) return <Upload className="h-4 w-4" />;
    if (t.includes('move') || t.includes('status')) return <ArrowRightLeft className="h-4 w-4" />;
    if (t.includes('schedule')) return <Calendar className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getActionColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('create') || t.includes('add')) return 'bg-blue-50 text-blue-600 border-blue-200';
    if (t.includes('approve')) return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (t.includes('reject') || t.includes('request')) return 'bg-orange-50 text-orange-600 border-orange-200';
    if (t.includes('comment')) return 'bg-indigo-50 text-indigo-600 border-indigo-200';
    if (t.includes('delete') || t.includes('remove')) return 'bg-red-50 text-red-600 border-red-200';
    if (t.includes('upload')) return 'bg-cyan-50 text-cyan-600 border-cyan-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const filteredLogs = logs.filter(log => {
    const isClient = log.user?.currentRole === 'client';
    if (filter === 'client') return isClient;
    if (filter === 'staff') return !isClient; // Staff includes everyone else (admin, designer, etc)
    return true;
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-b border-slate-100 gap-4">
        <h3 className="text-lg font-bold text-slate-900">Project Activity</h3>
        
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('staff')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${filter === 'staff' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Briefcase className="h-3 w-3" /> Team
          </button>
          <button 
            onClick={() => setFilter('client')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${filter === 'client' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <User className="h-3 w-3" /> Client
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 sm:p-6 relative min-h-[300px]">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
             <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 border border-slate-100">
               <Filter className="h-6 w-6 text-slate-300" />
             </div>
             <p>No activity found for this filter.</p>
          </div>
        ) : (
          <div className="space-y-6 before:absolute before:top-6 before:bottom-6 before:left-7 sm:before:left-9 before:w-px before:bg-slate-200">
             {filteredLogs.map((log) => {
                const isClient = log.user?.currentRole === 'client';
                // Role-based Card Styling
                const cardStyles = isClient 
                  ? 'bg-purple-50/50 border-purple-100 hover:border-purple-200' 
                  : 'bg-white border-slate-200 hover:border-primary-200';
                
                const badgeStyles = isClient
                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200';

                return (
                  <div key={log.id} className="relative pl-8 sm:pl-10 group">
                     {/* Timeline Dot */}
                     <div className={`absolute left-0 top-3 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 ${getActionColor(log.action_type)}`}>
                        {getActionIcon(log.action_type)}
                     </div>
                     
                     {/* Content Card */}
                     <div className={`p-3 sm:p-4 rounded-xl border transition-all shadow-sm ${cardStyles}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                           <div className="flex items-center gap-2 flex-wrap">
                              {/* Role Badge */}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeStyles}`}>
                                 {isClient ? 'Client' : 'Staff'}
                              </span>
                              <span className="text-sm font-bold text-slate-900 truncate">{log.user?.full_name || 'Unknown User'}</span>
                           </div>
                           <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                             <ClockIcon className="h-3 w-3" />
                             {new Date(log.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                        
                        <div className="text-sm text-slate-600">
                           <span className="capitalize font-semibold text-slate-800">{log.action_type.replace(/_/g, ' ')}</span>
                           {' '}
                           <span className="text-slate-500">on</span>
                           {' '}
                           <span className="font-medium text-slate-700 bg-black/5 px-1.5 py-0.5 rounded text-xs uppercase tracking-wide break-all sm:break-normal">{log.entity_type}</span>
                        </div>
                        
                        {log.details && (
                           <div className={`mt-3 text-xs p-3 rounded-lg border ${isClient ? 'bg-white/60 border-purple-100/50 text-purple-900' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                              {Object.entries(log.details).map(([key, value]) => (
                                 <div key={key} className="flex gap-1 mb-0.5 last:mb-0">
                                    <span className="font-medium capitalize opacity-70">{key.replace(/_/g, ' ')}:</span>
                                    <span className="font-semibold truncate">{String(value)}</span>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>
                );
             })}
          </div>
        )}
      </div>
    </div>
  );
};

// Simple helper component for the timestamp icon
const ClockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);