
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { timeService } from '../../services/timeService';
import { analyticsService } from '../../services/analyticsService';
import { TimeLog, EmployeePerformanceMetrics } from '../../types';
import { 
  Loader2, Clock, Calendar, Briefcase, User, TrendingUp, 
  AlertCircle, CheckCircle2, MessageSquare, Zap, Eye, 
  MoreHorizontal, AlertTriangle, Timer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const TimeManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [myLogs, setMyLogs] = useState<TimeLog[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<EmployeePerformanceMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my_time' | 'control_center'>('my_time');

  // Permission check
  const canViewControlCenter = user?.currentRole === 'super_admin' || user?.currentRole === 'account_manager';

  useEffect(() => {
    if (user?.currentOrganization) {
      fetchData();
      if (canViewControlCenter) {
          setActiveTab('control_center');
      }
    }
  }, [user?.currentOrganization, activeTab]);

  const fetchData = async () => {
    if (!user?.currentOrganization) return;
    setIsLoading(true);
    try {
      const myData = await timeService.getUserLogs(user.id, 7);
      setMyLogs(myData);

      if (canViewControlCenter) {
        const perfData = await analyticsService.getEmployeePerformance(user.currentOrganization.id);
        setTeamPerformance(perfData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Calculations for My Time ---
  const today = new Date().toISOString().split('T')[0];
  const myTodayLogs = myLogs.filter(l => l.start_time.startsWith(today));
  const myTodayMinutes = myTodayLogs.reduce((acc, l) => acc + (l.duration_minutes || 0), 0);
  const myWeekMinutes = myLogs.reduce((acc, l) => acc + (l.duration_minutes || 0), 0);

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'working': return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
          case 'idle': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]';
          default: return 'bg-slate-300 dark:bg-slate-600';
      }
  };

  if (isLoading && myLogs.length === 0) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Time & Control</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor attendance, activity, and performance.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
           <button 
             onClick={() => setActiveTab('my_time')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'my_time' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
           >
             My Timesheet
           </button>
           {canViewControlCenter && (
             <button 
               onClick={() => setActiveTab('control_center')}
               className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'control_center' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
             >
               <Eye className="h-4 w-4" /> Control Center
             </button>
           )}
        </div>
      </div>

      {activeTab === 'my_time' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
           {/* Personal Stats */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="dark:bg-slate-800 dark:border-slate-700">
                 <CardContent className="p-6 flex items-center justify-between">
                    <div>
                       <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Worked Today</p>
                       <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatDuration(myTodayMinutes)}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                       <Clock className="h-6 w-6" />
                    </div>
                 </CardContent>
              </Card>
              <Card className="dark:bg-slate-800 dark:border-slate-700">
                 <CardContent className="p-6 flex items-center justify-between">
                    <div>
                       <p className="text-sm font-medium text-slate-500 dark:text-slate-400">This Week</p>
                       <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatDuration(myWeekMinutes)}</h3>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                       <Calendar className="h-6 w-6" />
                    </div>
                 </CardContent>
              </Card>
              <Card className="dark:bg-slate-800 dark:border-slate-700">
                 <CardContent className="p-6 flex items-center justify-between">
                    <div>
                       <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Efficiency Score</p>
                       <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">94%</h3>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                       <TrendingUp className="h-6 w-6" />
                    </div>
                 </CardContent>
              </Card>
           </div>

           {/* Logs List */}
           <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader><CardTitle className="dark:text-white">Recent Activity Logs</CardTitle></CardHeader>
              <CardContent>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                             <th className="px-4 py-3">Date</th>
                             <th className="px-4 py-3">Description</th>
                             <th className="px-4 py-3">Project</th>
                             <th className="px-4 py-3">Duration</th>
                             <th className="px-4 py-3 text-right">Status</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {myLogs.map(log => (
                             <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{new Date(log.start_time).toLocaleDateString()}</td>
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{log.description}</td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                   {log.project ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-xs">
                                         <Briefcase className="h-3 w-3" /> {log.project.name}
                                      </span>
                                   ) : '-'}
                                </td>
                                <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{log.end_time ? formatDuration(log.duration_minutes) : 'Running...'}</td>
                                <td className="px-4 py-3 text-right">
                                   {log.end_time ? (
                                      <span className="text-green-600 dark:text-green-400 text-xs font-bold bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">Completed</span>
                                   ) : (
                                      <span className="text-blue-600 dark:text-blue-400 text-xs font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full animate-pulse">Active</span>
                                   )}
                                </td>
                             </tr>
                          ))}
                          {myLogs.length === 0 && (
                             <tr><td colSpan={5} className="text-center py-8 text-slate-400 dark:text-slate-500">No time logs recorded yet.</td></tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </CardContent>
           </Card>
        </div>
      )}

      {activeTab === 'control_center' && canViewControlCenter && (
         <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            
            {/* High Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <Card className="bg-white dark:bg-slate-800 border-l-4 border-l-green-500 shadow-sm">
                  <CardContent className="p-4">
                     <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Online Now</div>
                     <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {teamPerformance.filter(p => p.current_status !== 'offline').length} / {teamPerformance.length}
                        <span className="flex h-3 w-3 relative">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                     </div>
                  </CardContent>
               </Card>
               <Card className="bg-white dark:bg-slate-800 border-l-4 border-l-red-500 shadow-sm">
                  <CardContent className="p-4">
                     <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Late Arrivals</div>
                     <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {teamPerformance.reduce((acc, p) => acc + (p.avg_lateness_minutes > 15 ? 1 : 0), 0)}
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                     </div>
                  </CardContent>
               </Card>
               <Card className="bg-white dark:bg-slate-800 border-l-4 border-l-amber-500 shadow-sm">
                  <CardContent className="p-4">
                     <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Overdue Tasks</div>
                     <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {teamPerformance.reduce((acc, p) => acc + p.tasks_overdue, 0)}
                        <Clock className="h-5 w-5 text-amber-500" />
                     </div>
                  </CardContent>
               </Card>
               <Card className="bg-white dark:bg-slate-800 border-l-4 border-l-blue-500 shadow-sm">
                  <CardContent className="p-4">
                     <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Avg Chat Response</div>
                     <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        12m
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                     </div>
                  </CardContent>
               </Card>
            </div>

            {/* Control Center Grid */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                   <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary-600" /> Live Employee Monitor
                   </h3>
                   <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span> Live
                   </span>
                </div>
                
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                         <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Employee</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Live Activity</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Timeline (Today)</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Discipline</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Stats</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                         {teamPerformance.map(emp => (
                            <tr key={emp.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                               
                               {/* 1. Employee Info */}
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                     <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 border-2 border-white dark:border-slate-800 shadow-sm">
                                           {emp.user_avatar ? <img src={emp.user_avatar} className="w-full h-full rounded-full object-cover" /> : emp.user_name[0]}
                                        </div>
                                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${getStatusColor(emp.current_status)}`}></div>
                                     </div>
                                     <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{emp.user_name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{emp.user_role}</p>
                                     </div>
                                  </div>
                               </td>

                               {/* 2. Live Activity */}
                               <td className="px-6 py-4">
                                  {emp.current_status === 'working' ? (
                                     <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wider">
                                           <Timer className="h-3.5 w-3.5 animate-pulse" /> Active Now
                                        </div>
                                        <div className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[200px]" title={emp.current_task || 'General Task'}>
                                           {emp.current_task || 'General Work'}
                                        </div>
                                        {emp.current_project && (
                                           <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 border border-slate-200 dark:border-slate-700 w-fit">
                                              {emp.current_project}
                                           </span>
                                        )}
                                     </div>
                                  ) : (
                                     <div className="flex items-center gap-2 text-slate-400">
                                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                                        <span className="text-sm">{emp.current_status === 'idle' ? 'Idle (Away)' : 'Offline'}</span>
                                     </div>
                                  )}
                               </td>

                               {/* 3. Visual Timeline Bar (Simulated) */}
                               <td className="px-6 py-4 min-w-[200px]">
                                  <div className="flex flex-col gap-1">
                                     <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                        <span>09:00</span>
                                        <span>13:00</span>
                                        <span>18:00</span>
                                     </div>
                                     <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                        {/* Mock Segments based on status */}
                                        {emp.current_status === 'offline' ? (
                                            <div className="h-full bg-slate-200 dark:bg-slate-700 w-full"></div>
                                        ) : (
                                            <>
                                                {/* Late Start? */}
                                                {emp.avg_lateness_minutes > 15 && <div className="h-full bg-red-400 w-[10%]" title="Late"></div>}
                                                <div className="h-full bg-green-500 w-[30%]" title="Working"></div>
                                                <div className="h-full bg-amber-300 w-[10%]" title="Break"></div>
                                                <div className="h-full bg-green-500 w-[40%]" title="Working"></div>
                                                {emp.current_status === 'working' && <div className="h-full bg-green-400 animate-pulse flex-1" title="Active"></div>}
                                            </>
                                        )}
                                     </div>
                                     <div className="text-[10px] text-right text-slate-500">
                                        {emp.total_hours_today.toFixed(1)}h logged today
                                     </div>
                                  </div>
                               </td>

                               {/* 4. Discipline & Flags */}
                               <td className="px-6 py-4">
                                  <div className="flex flex-wrap gap-2">
                                     {emp.avg_lateness_minutes > 15 && (
                                        <div className="px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded border border-red-100 dark:border-red-900/50 flex items-center gap-1" title={`Average ${emp.avg_lateness_minutes}m late`}>
                                           <AlertTriangle className="h-3 w-3" /> Late ({emp.avg_lateness_minutes}m)
                                        </div>
                                     )}
                                     {emp.missed_messages_count > 3 && (
                                        <div className="px-2 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold rounded border border-orange-100 dark:border-orange-900/50 flex items-center gap-1">
                                           <MessageSquare className="h-3 w-3" /> Unresponsive
                                        </div>
                                     )}
                                     {emp.tasks_overdue > 0 && (
                                        <div className="px-2 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold rounded border border-amber-100 dark:border-amber-900/50 flex items-center gap-1">
                                           <Clock className="h-3 w-3" /> {emp.tasks_overdue} Overdue
                                        </div>
                                     )}
                                     {emp.avg_lateness_minutes <= 15 && emp.tasks_overdue === 0 && (
                                        <div className="px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold rounded border border-green-100 dark:border-green-900/50 flex items-center gap-1">
                                           <CheckCircle2 className="h-3 w-3" /> Good Standing
                                        </div>
                                     )}
                                  </div>
                               </td>

                               {/* 5. Mini Stats */}
                               <td className="px-6 py-4 text-right">
                                  <div className="flex flex-col items-end gap-1">
                                     <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Chat Resp: <span className={emp.avg_chat_response_time_minutes > 30 ? 'text-red-500 font-bold' : 'text-slate-900 dark:text-white'}>{emp.avg_chat_response_time_minutes}m</span>
                                     </div>
                                     <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Tasks: <span className="text-slate-900 dark:text-white">{emp.task_efficiency_rate}%</span> on time
                                     </div>
                                  </div>
                               </td>

                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};
