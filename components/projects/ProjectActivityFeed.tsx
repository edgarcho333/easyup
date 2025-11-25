
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
  className?: string;
}

type FilterType = 'all' | 'staff' | 'client';

export const ProjectActivityFeed: React.FC<ProjectActivityFeedProps> = ({ projectId, className = '' }) => {
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
    if (t.includes('create') || t.includes('add')) return 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    if (t.includes('approve')) return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    if (t.includes('reject') || t.includes('request')) return 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800';
    if (t.includes('comment')) return 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
    if (t.includes('delete') || t.includes('remove')) return 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
    if (t.includes('upload')) return 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800';
    return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600';
  };

  const filteredLogs = logs.filter(log => {
    const isClient = log.user?.currentRole === 'client';
    if (filter === 'client') return isClient;
    if (filter === 'staff') return !isClient; // Staff includes everyone else (admin, designer, etc)
    return true;
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col ${className}`}>
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 gap-4 shrink-0 bg-white dark:bg-slate-900 z-10">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Project Activity</h3>
        
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start sm:self-auto border border-slate-200/50 dark:border-slate-700/50">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${filter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('staff')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${filter === 'staff' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <Briefcase className="h-3 w-3" /> Team
          </button>
          <button 
            onClick={() => setFilter('client')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${filter === 'client' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <User className="h-3 w-3" /> Client
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 sm:p-6 relative flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
             <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 border border-slate-100 dark:border-slate-700">
               <Filter className="h-6 w-6 text-slate-300 dark:text-slate-600" />
             </div>
             <p className="dark:text-slate-400">No activity found for this filter.</p>
          </div>
        ) : (
          <div className="space-y-6 before:absolute before:top-6 before:bottom-6 before:left-7 sm:before:left-9 before:w-px before:bg-slate-200 dark:before:bg-slate-700">
             {filteredLogs.map((log) => {
                const isClient = log.user?.currentRole === 'client';
                // Role-based Card Styling
                const cardStyles = isClient 
                  ? 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30 hover:border-purple-200 dark:hover:border-purple-800' 
                  : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800';
                
                const badgeStyles = isClient
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';

                return (
                  <div key={log.id} className="relative pl-8 sm:pl-10 group">
                     {/* Timeline Dot */}
                     <div className={`absolute left-0 top-3 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm z-10 ${getActionColor(log.action_type)}`}>
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
                              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{log.user?.full_name || 'Unknown User'}</span>
                           </div>
                           <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0">
                             <ClockIcon className="h-3 w-3" />
                             {new Date(log.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                        
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                           <span className="capitalize font-semibold text-slate-800 dark:text-slate-200">{log.action_type.replace(/_/g, ' ')}</span>
                           {' '}
                           <span className="text-slate-500 dark:text-slate-400">on</span>
                           {' '}
                           <span className="font-medium text-slate-700 dark:text-slate-300 bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded text-xs uppercase tracking-wide break-all sm:break-normal">{log.entity_type}</span>
                        </div>
                        
                        {log.details && (
                           <div className={`mt-3 text-xs p-3 rounded-lg border ${isClient ? 'bg-white/60 dark:bg-purple-900/20 border-purple-100/50 dark:border-purple-900/30 text-purple-900 dark:text-purple-300' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
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
