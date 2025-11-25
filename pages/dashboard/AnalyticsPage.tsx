

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/analyticsService';
import { timeService } from '../../services/timeService';
import { AnalyticsSummary, ActivityLog, ChartData, GeneratedReport, TimeLog, EmployeePerformanceMetrics, VelocityMetric, WorkloadDistribution } from '../../types';
import { 
  Loader2, TrendingUp, CheckCircle, Folder, FileText, Activity, Download, File, 
  Clock, Eye, AlertTriangle, MessageSquare, Timer, CheckCircle2, Calendar, Briefcase,
  Filter, BarChart2, ArrowRight, Zap, PieChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';
import { GenerateReportModal } from '../../components/analytics/GenerateReportModal';

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  
  // Main Tabs
  const [activeTab, setActiveTab] = useState<'time' | 'workload' | 'overview' | 'reports'>('time');
  
  // Time Tab Sub-state
  const [timeSubTab, setTimeSubTab] = useState<'my_time' | 'control_center'>('my_time');
  const [myLogs, setMyLogs] = useState<TimeLog[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<EmployeePerformanceMetrics[]>([]);
  
  // Analytics Data
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [trends, setTrends] = useState<ChartData[]>([]);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [velocityData, setVelocityData] = useState<VelocityMetric[]>([]);
  const [workloadDistribution, setWorkloadDistribution] = useState<WorkloadDistribution[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const canViewControlCenter = user?.currentRole === 'super_admin' || user?.currentRole === 'account_manager';

  useEffect(() => {
    if (user?.currentOrganization) {
      fetchData(user.currentOrganization.id);
    }
  }, [user?.currentOrganization]);

  const fetchData = async (orgId: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch Analytics Basics
      const [statsData, logsData, trendsData, reportsData, velocity, workload] = await Promise.all([
        analyticsService.getOrganizationStats(orgId),
        analyticsService.getActivityLogs(orgId),
        analyticsService.getIdeaTrends(orgId),
        analyticsService.getGeneratedReports(orgId),
        analyticsService.getTeamVelocity(orgId),
        analyticsService.getWorkloadDistribution(orgId)
      ]);
      setStats(statsData);
      setLogs(logsData);
      setTrends(trendsData);
      setReports(reportsData);
      setVelocityData(velocity);
      setWorkloadDistribution(workload);

      // 2. Fetch Time & Attendance Data
      if (user) {
        const myData = await timeService.getUserLogs(user.id, 7);
        setMyLogs(myData);

        if (canViewControlCenter) {
          const perfData = await analyticsService.getEmployeePerformance(orgId);
          setTeamPerformance(perfData);
          // Default to Control Center for admins in Time tab
          if (activeTab === 'time') setTimeSubTab('control_center');
        }
      }

    } catch (err) {
      console.error("Analytics fetch error", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Time Calculations ---
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

  const PIE_COLORS = ['#94a3b8', '#3b82f6', '#f59e0b', '#10b981']; // Todo, InProgress, Review, Done

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-6">
      
      {/* Header & Internal Navigation */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Performance & Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track team attendance, workload, and project health.</p>
        </div>
        
        {/* Main Navigation Pills */}
        <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto no-scrollbar w-full lg:w-auto">
           <button 
             onClick={() => setActiveTab('time')}
             className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'time' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
           >
             <Clock className="h-4 w-4" /> Time & Attendance
           </button>
           <button 
             onClick={() => setActiveTab('workload')}
             className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'workload' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
           >
             <BarChart2 className="h-4 w-4" /> Velocity & Workload
           </button>
           <button 
             onClick={() => setActiveTab('overview')}
             className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
           >
             <Activity className="h-4 w-4" /> Overview
           </button>
           <button 
             onClick={() => setActiveTab('reports')}
             className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'reports' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
           >
             <FileText className="h-4 w-4" /> Reports
           </button>
        </div>
      </div>

      {/* ---------------------- TAB 1: TIME & ATTENDANCE ---------------------- */}
      {activeTab === 'time' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
           
           {/* Sub-nav for Time */}
           <div className="flex justify-end">
              <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button 
                  onClick={() => setTimeSubTab('my_time')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeSubTab === 'my_time' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'}`}
                >
                  My Timesheet
                </button>
                {canViewControlCenter && (
                  <button 
                    onClick={() => setTimeSubTab('control_center')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${timeSubTab === 'control_center' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'}`}
                  >
                    <Eye className="h-3 w-3" /> Control Center
                  </button>
                )}
              </div>
           </div>

           {/* My Time View */}
           {timeSubTab === 'my_time' && (
             <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="dark:bg-slate-800 dark:border-slate-700">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Worked Today</p>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                  {formatDuration(myLogs.filter(l => l.start_time.startsWith(new Date().toISOString().split('T')[0])).reduce((acc, l) => acc + (l.duration_minutes || 0), 0))}
                                </h3>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full"><Clock className="h-6 w-6" /></div>
                        </CardContent>
                    </Card>
                    <Card className="dark:bg-slate-800 dark:border-slate-700">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">This Week</p>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                  {formatDuration(myLogs.reduce((acc, l) => acc + (l.duration_minutes || 0), 0))}
                                </h3>
                            </div>
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full"><Calendar className="h-6 w-6" /></div>
                        </CardContent>
                    </Card>
                    <Card className="dark:bg-slate-800 dark:border-slate-700">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Efficiency Score</p>
                                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">94%</h3>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full"><TrendingUp className="h-6 w-6" /></div>
                        </CardContent>
                    </Card>
                </div>

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

           {/* Control Center View */}
           {timeSubTab === 'control_center' && canViewControlCenter && (
             <div className="space-y-6 animate-in fade-in">
                
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
      )}

      {/* ---------------------- TAB 2: TASK VELOCITY & WORKLOAD ---------------------- */}
      {activeTab === 'workload' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
           
           {/* Workload KPIs */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="dark:bg-slate-800 dark:border-slate-700 border-l-4 border-l-indigo-500">
                 <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Team Capacity</p>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">85%</h3>
                       </div>
                       <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                          <Zap className="h-5 w-5" />
                       </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Optimal range: 80-90%</p>
                 </CardContent>
              </Card>
              <Card className="dark:bg-slate-800 dark:border-slate-700 border-l-4 border-l-green-500">
                 <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Avg Velocity</p>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">38 pts</h3>
                       </div>
                       <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                          <TrendingUp className="h-5 w-5" />
                       </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">+4 pts vs last sprint</p>
                 </CardContent>
              </Card>
              <Card className="dark:bg-slate-800 dark:border-slate-700 border-l-4 border-l-blue-500">
                 <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Cycle Time</p>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">3.2 days</h3>
                       </div>
                       <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                          <Clock className="h-5 w-5" />
                       </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">From In Progress to Done</p>
                 </CardContent>
              </Card>
              <Card className="dark:bg-slate-800 dark:border-slate-700 border-l-4 border-l-red-500">
                 <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Bottlenecks</p>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Review</h3>
                       </div>
                       <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                          <AlertTriangle className="h-5 w-5" />
                       </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">8 tasks pending review > 2 days</p>
                 </CardContent>
              </Card>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Velocity Chart */}
              <Card className="lg:col-span-2 dark:bg-slate-800 dark:border-slate-700">
                 <CardHeader>
                    <CardTitle className="dark:text-white">Sprint Velocity</CardTitle>
                 </CardHeader>
                 <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={velocityData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barSize={40}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                          <XAxis dataKey="sprint_name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip 
                             contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                             itemStyle={{ color: '#f8fafc' }}
                             cursor={{ fill: 'transparent' }}
                          />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          <Bar dataKey="planned_points" name="Planned Points" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="completed_points" name="Completed Points" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                       </BarChart>
                    </ResponsiveContainer>
                 </CardContent>
              </Card>

              {/* Resource Allocation */}
              <Card className="dark:bg-slate-800 dark:border-slate-700">
                 <CardHeader>
                    <CardTitle className="dark:text-white">Task Distribution</CardTitle>
                 </CardHeader>
                 <CardContent className="h-[350px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                       <RechartsPieChart>
                          <Pie
                             data={workloadDistribution}
                             cx="50%"
                             cy="50%"
                             innerRadius={60}
                             outerRadius={90}
                             paddingAngle={5}
                             dataKey="count"
                             nameKey="status"
                             stroke="none"
                          >
                             {workloadDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                             ))}
                          </Pie>
                          <Tooltip 
                             contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                             itemStyle={{ color: '#f8fafc', textTransform: 'capitalize' }}
                          />
                          <Legend 
                             verticalAlign="bottom" 
                             height={36} 
                             iconType="circle" 
                             formatter={(value) => <span className="capitalize text-slate-500 dark:text-slate-400 ml-1">{value.replace('_', ' ')}</span>}
                          />
                       </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                       <div className="text-3xl font-bold text-slate-900 dark:text-white">
                          {workloadDistribution.reduce((acc, curr) => acc + curr.count, 0)}
                       </div>
                       <div className="text-xs text-slate-500 uppercase font-medium">Total Tasks</div>
                    </div>
                 </CardContent>
              </Card>
           </div>

           {/* Detailed Team Load Matrix */}
           <Card className="dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900">
                 <div className="flex items-center justify-between">
                    <CardTitle className="dark:text-white">Team Load Matrix</CardTitle>
                    <div className="flex gap-2 text-xs">
                       <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Optimal</span>
                       <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Overloaded</span>
                       <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Underutilized</span>
                    </div>
                 </div>
              </CardHeader>
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                       <tr>
                          <th className="px-6 py-4 font-semibold">Member</th>
                          <th className="px-6 py-4 font-semibold w-1/3">Workload Capacity</th>
                          <th className="px-6 py-4 font-semibold">Active Tasks</th>
                          <th className="px-6 py-4 font-semibold">Efficiency</th>
                          <th className="px-6 py-4 font-semibold text-right">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                       {teamPerformance.map(emp => {
                          // Mock calculation: Assume 5 tasks is capacity
                          const activeCount = emp.active_task_count || 0;
                          const capacity = 5;
                          const loadPercent = Math.min((activeCount / capacity) * 100, 100);
                          
                          let statusColor = 'bg-slate-300 dark:bg-slate-600';
                          let statusText = 'Under';
                          if (activeCount >= 4 && activeCount <= 6) {
                             statusColor = 'bg-green-500';
                             statusText = 'Optimal';
                          } else if (activeCount > 6) {
                             statusColor = 'bg-red-500';
                             statusText = 'Overloaded';
                          }

                          return (
                             <tr key={emp.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                         {emp.user_avatar ? <img src={emp.user_avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold">{emp.user_name[0]}</div>}
                                      </div>
                                      <div>
                                         <p className="font-bold text-slate-900 dark:text-white">{emp.user_name}</p>
                                         <p className="text-xs text-slate-500 dark:text-slate-400">{emp.user_role}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
                                      <div className={`h-full rounded-full ${statusColor}`} style={{ width: `${loadPercent}%` }}></div>
                                   </div>
                                   <p className="text-xs text-slate-500 text-right">{activeCount} / {capacity} tasks</p>
                                </td>
                                <td className="px-6 py-4">
                                   <span className="text-slate-900 dark:text-white font-medium">{activeCount}</span>
                                   <span className="text-slate-400 text-xs ml-1">current</span>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-2">
                                      <div className="relative w-8 h-8">
                                         <svg className="w-full h-full" viewBox="0 0 36 36">
                                            <path className="text-slate-200 dark:text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                            <path className="text-indigo-500" strokeDasharray={`${emp.task_efficiency_rate}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                         </svg>
                                         <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-indigo-600 dark:text-indigo-400">
                                            {emp.task_efficiency_rate}%
                                         </div>
                                      </div>
                                      <span className="text-xs text-slate-500">Rating</span>
                                   </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                                      statusText === 'Optimal' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900' :
                                      statusText === 'Overloaded' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900' :
                                      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                   }`}>
                                      {statusText}
                                   </span>
                                </td>
                             </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>
      )}

      {/* ---------------------- TAB 3: OVERVIEW ---------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Projects</p>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats?.active_projects}</h3>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                      <Folder className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">of {stats?.total_projects} total projects</p>
              </CardContent>
            </Card>

            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ideas Generated</p>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats?.total_ideas}</h3>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                      <FileText className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Across all projects</p>
              </CardContent>
            </Card>

            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Approval Rate</p>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats?.approval_rate}%</h3>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{stats?.approved_ideas} ideas approved</p>
              </CardContent>
            </Card>

            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tasks Completed</p>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats?.tasks_completed}</h3>
                    </div>
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600 dark:text-orange-400">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Total finished tasks</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <Card className="lg:col-span-2 dark:bg-slate-800 dark:border-slate-700">
                <CardHeader><CardTitle className="dark:text-white">Content Velocity</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trends}>
                        <defs>
                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="#94a3b8" />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--card-bg, #fff)', borderRadius: '8px', border: '1px solid var(--card-border, #e2e8f0)' }} 
                          itemStyle={{ color: '#333' }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVal)" />
                      </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader><CardTitle className="dark:text-white">Recent Activity</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                      {logs.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No activity logs yet.</p>
                      ) : (
                        logs.map((log, i) => (
                            <div key={log.id || i} className="flex gap-3">
                              <div className="mt-0.5">
                                  <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                    <Activity className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                  </div>
                              </div>
                              <div>
                                  <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                                    <span className="font-bold">{log.user?.full_name || 'User'}</span> {log.action_type.replace('_', ' ')}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{log.entity_type}</p>
                                  <p className="text-[10px] text-slate-400 mt-1">{new Date(log.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                        ))
                      )}
                  </div>
                </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ---------------------- TAB 4: REPORTS ---------------------- */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
           <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <div>
               <h3 className="font-bold text-slate-900 dark:text-white">Generated Reports</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400">Download past performance reports.</p>
             </div>
             <Button onClick={() => setIsReportModalOpen(true)}>
               <Download className="h-4 w-4 mr-2" /> Generate New Report
             </Button>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {reports.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  <FileText className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200">No reports yet</h3>
                  <p className="text-slate-500 dark:text-slate-400">Generate your first report to see it here.</p>
                </div>
              ) : (
                reports.map(report => (
                  <div key={report.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:shadow-sm transition-shadow">
                     <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${report.type === 'pdf' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                           <File className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">{report.name}</h4>
                          <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                             <span>{new Date(report.created_at).toLocaleDateString()}</span>
                             <span>•</span>
                             <span className="capitalize">{report.date_range.replace('_', ' ')}</span>
                             <span>•</span>
                             <span>By {report.creator?.full_name || 'System'}</span>
                          </div>
                        </div>
                     </div>
                     <Button variant="outline" size="sm" onClick={() => alert(`Downloading ${report.file_url}...`)} className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                       <Download className="h-4 w-4 mr-2" /> Download
                     </Button>
                  </div>
                ))
              )}
           </div>
        </div>
      )}

      <GenerateReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        onSuccess={() => user?.currentOrganization && fetchData(user.currentOrganization.id)} 
      />
    </div>
  );
};