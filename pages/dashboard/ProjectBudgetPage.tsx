
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { budgetService } from '../../services/budgetService';
import { projectService } from '../../services/projectService';
import { ProjectBudget, PostCampaign, CampaignMetric, Project } from '../../types';
import { Loader2, ArrowLeft, DollarSign, TrendingUp, PieChart, Plus, Play, Pause, Trash2, MousePointer, Target, BarChart2, Eye, Settings, Users, Lightbulb, CheckSquare, Layout, Activity, MessageSquare, Briefcase, Wallet, Bell } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { CreateCampaignModal } from '../../components/budget/CreateCampaignModal';
import { AddMetricModal } from '../../components/budget/AddMetricModal';
import { Input } from '../../components/ui/Input';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';
import { ProjectChatSidebar } from '../../components/projects/ProjectChatSidebar';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationDropdown } from '../../components/notifications/NotificationDropdown';

export const ProjectBudgetPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notifications } = useNotifications();
  
  const [project, setProject] = useState<Project | null>(null);
  const [budget, setBudget] = useState<ProjectBudget | null>(null);
  const [campaigns, setCampaigns] = useState<PostCampaign[]>([]);
  const [metrics, setMetrics] = useState<CampaignMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<PostCampaign | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Edit Mode
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newTotal, setNewTotal] = useState('');

  useEffect(() => {
    if (id) fetchData(id);
  }, [id]);

  const fetchData = async (projectId: string) => {
    try {
      const [p, b, c, m] = await Promise.all([
        projectService.getProject(projectId),
        budgetService.getProjectBudget(projectId),
        budgetService.getCampaigns(projectId),
        budgetService.getProjectMetrics(projectId)
      ]);
      setProject(p);
      setBudget(b);
      setCampaigns(c);
      setMetrics(m);
      if (b) setNewTotal(b.total_budget.toString());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBudget = async () => {
    if (!id) return;
    try {
      await budgetService.setProjectBudget(id, { total_budget: parseFloat(newTotal), currency: 'USD', start_date: new Date().toISOString() });
      setIsEditingBudget(false);
      fetchData(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (campaign: PostCampaign) => {
      const newStatus = campaign.status === 'active' ? 'paused' : 'active';
      await budgetService.toggleCampaignStatus(campaign.id, newStatus);
      fetchData(id!);
  };

  const handleDeleteCampaign = async (campaignId: string) => {
      if(!confirm("Are you sure? This will delete the campaign.")) return;
      await budgetService.deleteCampaign(campaignId);
      fetchData(id!);
  };

  const openAddMetric = (campaign: PostCampaign) => {
      setSelectedCampaign(campaign);
      setIsMetricModalOpen(true);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layout },
    { id: 'content', label: 'Content', icon: Lightbulb },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'budget', label: 'Budget', icon: DollarSign },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === 'budget') {
      // Already here
    } else if (tabId === 'content') {
      navigate(`/projects/${id}/ideas`);
    } else {
      navigate(`/projects/${id}?tab=${tabId}`); // Pass tab query param
    }
  };

  // --- Calculations ---

  const totalBudget = budget?.total_budget || 0;
  const spent = budget?.budget_spent || 0;
  const remaining = totalBudget - spent;
  const percentUsed = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;

  // Aggregate Metrics
  const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
  const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
  const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0);
  const totalRevenue = metrics.reduce((sum, m) => sum + m.conversion_value, 0);

  const avgCPC = totalClicks > 0 ? spent / totalClicks : 0;
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const roas = spent > 0 ? totalRevenue / spent : 0;

  // Chart Data: Spend Over Time (Last 30 days or all time available)
  const chartDataMap = new Map<string, number>();
  metrics.forEach(m => {
      const date = new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      chartDataMap.set(date, (chartDataMap.get(date) || 0) + m.spend);
  });
  const spendTrendData = Array.from(chartDataMap.entries()).map(([name, value]) => ({ name, value }));

  // Chart Data: Platform Distribution
  const platformDataMap = new Map<string, number>();
  campaigns.forEach(c => {
      const platform = c.platforms[0] || 'other';
      platformDataMap.set(platform, (platformDataMap.get(platform) || 0) + c.budget_spent);
  });
  const platformPieData = Array.from(platformDataMap.entries()).map(([name, value]) => ({ name, value }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  // Filter notifications for this project
  const projectUnreadCount = notifications.filter(n => n.project_id === id && !n.is_read).length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
      
      {/* Unified Command Header - Sticky Top */}
      <div className="sticky top-0 z-30 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 mb-6">
        <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row items-center justify-between gap-4 transition-all">
           
           {/* LEFT: Project Context */}
           <div className="flex items-center gap-4 w-full lg:w-auto">
              <button 
                onClick={() => navigate('/projects')}
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm group shrink-0"
                title="Back to Projects"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
              
              <div className="flex items-center gap-3 min-w-0 flex-1">
                 {project ? (
                   <>
                     <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner ring-2 ring-white dark:ring-slate-800">
                        {project.name[0]}
                     </div>
                     <div className="flex flex-col min-w-0">
                        <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight flex items-center gap-2">
                          {project.name}
                          <span className={`inline-flex w-2 h-2 rounded-full ${project.status === 'active' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                        </h1>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                           <Briefcase className="h-3 w-3" />
                           <span className="truncate">{project.client_name}</span>
                        </div>
                     </div>
                   </>
                 ) : (
                   <>
                     <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0"></div>
                     <div className="flex flex-col gap-1.5 w-32">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-full"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-2/3"></div>
                     </div>
                   </>
                 )}
              </div>
           </div>

           {/* CENTER: Navigation Tabs */}
           <div className="w-full lg:w-auto overflow-x-auto no-scrollbar flex justify-center order-last lg:order-none">
              <div className="flex items-center p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-full border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm">
                 {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = tab.id === 'budget';
                    return (
                       <button
                          key={tab.id}
                          onClick={() => handleTabClick(tab.id)}
                          className={`
                             flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap
                             ${isActive 
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'}
                          `}
                       >
                          <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                          {tab.label}
                       </button>
                    );
                 })}
              </div>
           </div>

           {/* RIGHT: Actions */}
           <div className="flex items-center justify-end gap-3 w-full lg:w-auto hidden sm:flex">
              {/* Project Notification Bell */}
              <div className="relative">
                  <button 
                      onClick={() => setIsNotifOpen(!isNotifOpen)}
                      className="h-9 w-9 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                  >
                      <Bell className="h-4 w-4" />
                      {projectUnreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                      )}
                  </button>
                  <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} projectId={id} />
              </div>

              <button 
                onClick={() => setIsChatOpen(true)} 
                className="group relative flex items-center gap-2 pl-3 pr-4 py-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                 <div className="relative">
                   <MessageSquare className="h-4 w-4 text-indigo-200 dark:text-indigo-600" />
                   <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-blue-500 rounded-full border-2 border-slate-900 dark:border-slate-100 animate-pulse"></span>
                 </div>
                 <span className="font-medium text-xs">Project Chat</span>
              </button>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {isLoading ? (
           <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
        ) : !project ? (
           <div className="p-8 text-center text-slate-500 dark:text-slate-400">Project not found</div>
        ) : (
           <>
            {/* Page Specific Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 px-4 sm:px-6 lg:px-8">
              <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Budget & Advertising</h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Track campaign performance, spend, and ROI.</p>
              </div>
              <div className="flex gap-3">
                {isEditingBudget ? (
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 pr-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-right-5">
                      <Input className="w-32 h-9 dark:bg-slate-900 dark:border-slate-600 dark:text-white" value={newTotal} onChange={e => setNewTotal(e.target.value)} type="number" placeholder="Budget" />
                      <Button size="sm" onClick={handleSaveBudget}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingBudget(false)} className="dark:text-slate-300 dark:hover:bg-slate-700">Cancel</Button>
                    </div>
                ) : (
                    <Button variant="outline" onClick={() => setIsEditingBudget(true)} className="dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                        Edit Total Budget
                    </Button>
                )}
                <Button onClick={() => setIsCreateModalOpen(true)} className="shadow-lg shadow-primary-200 dark:shadow-none">
                  <Plus className="h-4 w-4 mr-2" /> New Campaign
                </Button>
              </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 px-4 sm:px-6 lg:px-8">
              {/* Overall Budget Breakdown Card */}
              <Card className="relative overflow-hidden border-l-4 border-l-primary-500 col-span-1 md:col-span-2 lg:col-span-1 dark:bg-slate-800 dark:border-slate-700">
                  <CardContent className="p-6 h-full flex flex-col justify-between">
                    <div className="space-y-4">
                       <div className="flex justify-between items-start">
                          <div>
                             <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Budget</p>
                             <h3 className="text-2xl font-bold text-slate-900 dark:text-white">${totalBudget.toLocaleString()}</h3>
                          </div>
                          <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                             <Wallet className="h-5 w-5" />
                          </div>
                       </div>
                       
                       <div className="flex justify-between items-end pt-2 border-t border-slate-100 dark:border-slate-700">
                          <div>
                             <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Spent</p>
                             <p className="text-lg font-bold text-slate-700 dark:text-slate-200">${spent.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Remaining</p>
                             <p className={`text-sm font-bold ${remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>${remaining.toLocaleString()}</p>
                          </div>
                       </div>
                    </div>

                    <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                          <span>Utilization</span>
                          <span>{percentUsed.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-500 ${percentUsed > 90 ? 'bg-red-500' : percentUsed > 75 ? 'bg-orange-500' : 'bg-primary-500'}`} style={{ width: `${Math.min(percentUsed, 100)}%` }} />
                        </div>
                    </div>
                  </CardContent>
              </Card>

              {/* Impressions / Clicks */}
              <Card className="border-l-4 border-l-purple-500 dark:bg-slate-800 dark:border-slate-700">
                  <CardContent className="p-6 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Impressions</p>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalImpressions.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                          <Eye className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700">
                        <div className="flex items-center gap-1.5">
                            <MousePointer className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{totalClicks.toLocaleString()}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Clicks</span>
                        </div>
                    </div>
                  </CardContent>
              </Card>

              {/* Efficiency (CPC / CTR) */}
              <Card className="border-l-4 border-l-blue-500 dark:bg-slate-800 dark:border-slate-700">
                  <CardContent className="p-6 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg. CTR</p>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{avgCTR.toFixed(2)}%</h3>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                          <Target className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">${avgCPC.toFixed(2)}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">CPC</span>
                        </div>
                    </div>
                  </CardContent>
              </Card>

              {/* ROAS */}
              <Card className="border-l-4 border-l-green-500 dark:bg-slate-800 dark:border-slate-700">
                  <CardContent className="p-6 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total ROAS</p>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{roas.toFixed(2)}x</h3>
                        </div>
                        <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-green-700 dark:text-green-400">+${totalRevenue.toLocaleString()}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Revenue</span>
                        </div>
                    </div>
                  </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 px-4 sm:px-6 lg:px-8">
                <Card className="lg:col-span-2 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                    <CardHeader>
                        <CardTitle className="dark:text-white">Ad Spend Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[320px]">
                      {spendTrendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={spendTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <defs>
                                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.1} />
                              <Tooltip 
                                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
                                  itemStyle={{ color: '#f8fafc' }}
                                  labelStyle={{ color: '#94a3b8' }}
                                  formatter={(value: number) => [`$${value}`, 'Spend']}
                              />
                              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                              <BarChart2 className="h-10 w-10 mb-2 opacity-20" />
                              <p className="text-sm">No metric data available yet</p>
                          </div>
                      )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm dark:bg-slate-800 dark:border-slate-700">
                    <CardHeader>
                        <CardTitle className="dark:text-white">Spend by Platform</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[320px]">
                      {platformPieData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                              <RechartsPieChart>
                                  <Pie
                                      data={platformPieData}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={60}
                                      outerRadius={80}
                                      paddingAngle={5}
                                      dataKey="value"
                                      stroke="none"
                                  >
                                      {platformPieData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                  </Pie>
                                  <Tooltip 
                                     formatter={(value: number) => `$${value}`} 
                                     contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', color: '#f8fafc' }}
                                     itemStyle={{ color: '#f8fafc' }}
                                  />
                                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: '#94a3b8' }} />
                              </RechartsPieChart>
                          </ResponsiveContainer>
                      ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                              <PieChart className="h-10 w-10 mb-2 opacity-20" />
                              <p className="text-sm">No spending data available</p>
                          </div>
                      )}
                    </CardContent>
                </Card>
            </div>

            {/* Campaigns Table */}
            <Card className="overflow-hidden shadow-sm border-slate-200 dark:border-slate-700 dark:bg-slate-800 mx-4 sm:mx-6 lg:mx-8 mb-8">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                    <CardTitle className="dark:text-white">Campaign Performance</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Campaign</th>
                                <th className="px-6 py-4">Budget</th>
                                <th className="px-6 py-4">Spent</th>
                                <th className="px-6 py-4 text-center">Metrics</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        No active campaigns found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                campaigns.map(c => {
                                    // Calculate specific metrics for this campaign
                                    const cMetrics = metrics.filter(m => m.post_campaign_id === c.id);
                                    const cImps = cMetrics.reduce((s, m) => s + m.impressions, 0);
                                    const cClicks = cMetrics.reduce((s, m) => s + m.clicks, 0);
                                    const cCTR = cImps > 0 ? ((cClicks / cImps) * 100).toFixed(1) : '0.0';

                                    return (
                                        <tr key={c.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => handleToggleStatus(c)}
                                                    className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border transition-all ${
                                                        c.status === 'active' 
                                                        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/50 hover:bg-green-100 dark:hover:bg-green-900/50' 
                                                        : c.status === 'paused'
                                                        ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/50 hover:bg-yellow-100 dark:hover:bg-yellow-900/50'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                                    }`}
                                                >
                                                    {c.status === 'active' ? <Play className="h-3 w-3 fill-current" /> : <Pause className="h-3 w-3 fill-current" />}
                                                    {c.status}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900 dark:text-white">{c.campaign_name}</p>
                                                <div className="flex gap-1 mt-1">
                                                    {c.platforms.map(p => (
                                                        <span key={p} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 capitalize">
                                                            {p}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">${c.budget_allocated.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 dark:text-white">${c.budget_spent.toLocaleString()}</div>
                                                <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((c.budget_spent / c.budget_allocated) * 100, 100)}%` }} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                                                    <div className="text-center">
                                                        <div className="font-bold text-slate-900 dark:text-white">{cImps.toLocaleString()}</div>
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">Impr.</div>
                                                    </div>
                                                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                                                    <div className="text-center">
                                                        <div className="font-bold text-slate-900 dark:text-white">{cClicks.toLocaleString()}</div>
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">Clicks</div>
                                                    </div>
                                                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                                                    <div className="text-center">
                                                        <div className="font-bold text-slate-900 dark:text-white">{cCTR}%</div>
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">CTR</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="sm" variant="outline" onClick={() => openAddMetric(c)} title="Log Daily Metrics" className="h-8 px-2 text-xs border-slate-200 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                                                        <Plus className="h-3.5 w-3.5 mr-1" /> Log Data
                                                    </Button>
                                                    <button 
                                                        onClick={() => handleDeleteCampaign(c.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                        title="Delete Campaign"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
           </>
        )}
      </div>

      <CreateCampaignModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={() => fetchData(id!)} 
        projectId={id!} 
      />

      <AddMetricModal 
        isOpen={isMetricModalOpen}
        onClose={() => setIsMetricModalOpen(false)}
        onSuccess={() => fetchData(id!)}
        campaign={selectedCampaign}
      />

      {project && (
        <ProjectChatSidebar 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          projectId={project.id}
        />
      )}
    </div>
  );
};
