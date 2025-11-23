
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/analyticsService';
import { AnalyticsSummary, ActivityLog, ChartData, GeneratedReport } from '../../types';
import { Loader2, TrendingUp, CheckCircle, Folder, FileText, Activity, Download, File } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GenerateReportModal } from '../../components/analytics/GenerateReportModal';

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [trends, setTrends] = useState<ChartData[]>([]);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reports'>('overview');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    if (user?.currentOrganization) {
      fetchData(user.currentOrganization.id);
    }
  }, [user?.currentOrganization]);

  const fetchData = async (orgId: string) => {
    try {
      const [statsData, logsData, trendsData, reportsData] = await Promise.all([
        analyticsService.getOrganizationStats(orgId),
        analyticsService.getActivityLogs(orgId),
        analyticsService.getIdeaTrends(orgId),
        analyticsService.getGeneratedReports(orgId)
      ]);
      setStats(statsData);
      setLogs(logsData);
      setTrends(trendsData);
      setReports(reportsData);
    } catch (err) {
      console.error("Analytics fetch error", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics & Reports</h1>
          <p className="text-slate-500 mt-1">Track performance and generate insights.</p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
           <button 
             onClick={() => setActiveTab('overview')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
           >
             Overview
           </button>
           <button 
             onClick={() => setActiveTab('reports')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'reports' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
           >
             Reports
           </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Active Projects</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.active_projects}</h3>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                      <Folder className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">of {stats?.total_projects} total projects</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Ideas Generated</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.total_ideas}</h3>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                      <FileText className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Across all projects</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Approval Rate</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.approval_rate}%</h3>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full text-green-600">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{stats?.approved_ideas} ideas approved</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Tasks Completed</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.tasks_completed}</h3>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full text-orange-600">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Total finished tasks</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Content Velocity</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trends}>
                        <defs>
                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVal)" />
                      </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
                <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                      {logs.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No activity logs yet.</p>
                      ) : (
                        logs.map((log, i) => (
                            <div key={log.id || i} className="flex gap-3">
                              <div className="mt-0.5">
                                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                    <Activity className="h-4 w-4 text-slate-500" />
                                  </div>
                              </div>
                              <div>
                                  <p className="text-sm font-medium text-slate-900">
                                    <span className="font-bold">{log.user?.full_name || 'User'}</span> {log.action_type.replace('_', ' ')}
                                  </p>
                                  <p className="text-xs text-slate-500 capitalize">{log.entity_type}</p>
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

      {activeTab === 'reports' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
           <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
             <div>
               <h3 className="font-bold text-slate-900">Generated Reports</h3>
               <p className="text-sm text-slate-500">Download past performance reports.</p>
             </div>
             <Button onClick={() => setIsReportModalOpen(true)}>
               <Download className="h-4 w-4 mr-2" /> Generate New Report
             </Button>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {reports.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <h3 className="text-lg font-medium text-slate-900">No reports yet</h3>
                  <p className="text-slate-500">Generate your first report to see it here.</p>
                </div>
              ) : (
                reports.map(report => (
                  <div key={report.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:shadow-sm transition-shadow">
                     <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${report.type === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                           <File className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{report.name}</h4>
                          <div className="flex gap-3 text-xs text-slate-500 mt-1">
                             <span>{new Date(report.created_at).toLocaleDateString()}</span>
                             <span>•</span>
                             <span className="capitalize">{report.date_range.replace('_', ' ')}</span>
                             <span>•</span>
                             <span>By {report.creator?.full_name || 'System'}</span>
                          </div>
                        </div>
                     </div>
                     <Button variant="outline" size="sm" onClick={() => alert(`Downloading ${report.file_url}...`)}>
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
        onSuccess={() => fetchData(user?.currentOrganization?.id || '')} 
      />
    </div>
  );
};