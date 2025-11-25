
import React, { useMemo, useState, useEffect } from 'react';
import { Task, Project, ProjectBudget } from '../../types';
import { taskService } from '../../services/taskService';
import { budgetService } from '../../services/budgetService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Loader2 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

interface ProjectDashboardProps {
  projectId: string;
  project?: Project | null;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ projectId, project }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [budget, setBudget] = useState<ProjectBudget | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tasksData, budgetData] = await Promise.all([
          taskService.getProjectTasks(projectId),
          budgetService.getProjectBudget(projectId)
        ]);
        setTasks(tasksData);
        setBudget(budgetData);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [projectId]);

  // --- Calculations ---
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const incomplete = total - completed;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const overdue = tasks.filter(t => 
      t.status !== 'done' && 
      t.due_date && 
      new Date(t.due_date) < today
    ).length;

    return { total, completed, incomplete, overdue };
  }, [tasks]);

  // Chart 1: Tasks by Status (Bar)
  const statusData = useMemo(() => {
    const counts: Record<string, number> = { todo: 0, in_progress: 0, review: 0, done: 0 };
    tasks.forEach(t => {
      if (counts[t.status] !== undefined) counts[t.status]++;
    });
    return [
      { name: 'To Do', value: counts.todo, fill: '#94a3b8' }, // slate-400
      { name: 'In Progress', value: counts.in_progress, fill: '#60a5fa' }, // blue-400
      { name: 'Review', value: counts.review, fill: '#f59e0b' }, // amber-500
      { name: 'Done', value: counts.done, fill: '#10b981' }, // emerald-500
    ];
  }, [tasks]);

  // Chart 2: Completion Status (Donut)
  const completionData = [
    { name: 'Complete', value: stats.completed },
    { name: 'Incomplete', value: stats.incomplete },
  ];
  const completionColors = ['#8b5cf6', '#e2e8f0']; // Violet for complete, Slate for incomplete

  // Chart 3: Tasks by Assignee (Bar)
  const assigneeData = useMemo(() => {
    const map = new Map<string, number>();
    tasks.filter(t => t.status !== 'done').forEach(t => {
      if (t.assignees && t.assignees.length > 0) {
          t.assignees.forEach(user => {
              const name = user.full_name;
              map.set(name, (map.get(name) || 0) + 1);
          });
      } else {
          const name = 'Unassigned';
          map.set(name, (map.get(name) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name: name.split(' ')[0], value })) // Take first name
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [tasks]);

  // Chart 4: Tasks by Priority (Bar)
  const priorityData = useMemo(() => {
    const counts: Record<string, number> = { high: 0, medium: 0, low: 0 };
    tasks.filter(t => t.status !== 'done').forEach(t => {
       if (counts[t.priority] !== undefined) counts[t.priority]++;
    });
    return [
        { name: 'High', value: counts.high, fill: '#ef4444' },
        { name: 'Medium', value: counts.medium, fill: '#f59e0b' },
        { name: 'Low', value: counts.low, fill: '#3b82f6' }
    ];
  }, [tasks]);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Row: Number Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-t-4 border-t-green-500 shadow-sm dark:bg-slate-800 dark:border-slate-700">
           <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.completed}</div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Completed tasks</div>
           </CardContent>
        </Card>
        <Card className="border-t-4 border-t-purple-500 shadow-sm dark:bg-slate-800 dark:border-slate-700">
           <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.incomplete}</div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Incomplete tasks</div>
           </CardContent>
        </Card>
        <Card className="border-t-4 border-t-red-500 shadow-sm dark:bg-slate-800 dark:border-slate-700">
           <CardContent className="p-6 flex flex-col items-center text-center">
              <div className={`text-3xl font-bold ${stats.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>{stats.overdue}</div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Overdue tasks</div>
           </CardContent>
        </Card>
        <Card className="border-t-4 border-t-blue-500 shadow-sm dark:bg-slate-800 dark:border-slate-700">
           <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Total tasks</div>
           </CardContent>
        </Card>
      </div>

      {/* Middle Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart: Tasks by Status */}
        <Card className="shadow-sm dark:bg-slate-800 dark:border-slate-700">
           <CardHeader>
             <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Tasks by Status</CardTitle>
           </CardHeader>
           <CardContent className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={30}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.2} />
                 <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="#94a3b8" />
                 <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#94a3b8" />
                 <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#f8fafc' }} />
                 <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </CardContent>
        </Card>

        {/* Chart: Completion Donut */}
        <Card className="shadow-sm dark:bg-slate-800 dark:border-slate-700">
           <CardHeader>
             <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Completion Status</CardTitle>
           </CardHeader>
           <CardContent className="h-[250px] relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={completionData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                   stroke="none"
                 >
                   {completionData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={completionColors[index % completionColors.length]} />
                   ))}
                 </Pie>
                 <Legend verticalAlign="bottom" iconType="circle" height={36}/>
                 <Tooltip contentStyle={{ borderRadius: '8px', backgroundColor: '#f8fafc', border: 'none' }} />
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                <div className="text-center">
                   <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
                   <div className="text-[10px] text-slate-400 uppercase">Total</div>
                </div>
             </div>
           </CardContent>
        </Card>

        {/* Chart: Tasks by Assignee */}
        <Card className="shadow-sm dark:bg-slate-800 dark:border-slate-700">
           <CardHeader>
             <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Incomplete by Assignee</CardTitle>
           </CardHeader>
           <CardContent className="h-[250px]">
             {assigneeData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={assigneeData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }} barSize={20}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" strokeOpacity={0.2} />
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" width={60} fontSize={11} tickLine={false} axisLine={false} stroke="#94a3b8" />
                   <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', backgroundColor: '#f8fafc', border: 'none' }} />
                   <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                   <p className="text-sm">No incomplete tasks assigned.</p>
                </div>
             )}
           </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Priority & Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         {/* Priority Breakdown */}
         <Card className="shadow-sm dark:bg-slate-800 dark:border-slate-700">
            <CardHeader><CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Task Priority Distribution</CardTitle></CardHeader>
            <CardContent className="h-[200px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }} barSize={40}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.2} />
                     <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="#94a3b8" />
                     <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="#94a3b8" />
                     <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', backgroundColor: '#f8fafc', border: 'none' }} />
                     <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {priorityData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </CardContent>
         </Card>

         {/* Budget Snapshot (if exists) */}
         <Card className="shadow-sm dark:bg-slate-800 dark:border-slate-700">
            <CardHeader><CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Budget Overview</CardTitle></CardHeader>
            <CardContent className="h-[200px] flex flex-col justify-center">
               {budget ? (
                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-1">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total Budget</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">${budget.total_budget.toLocaleString()}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Actual Spend</p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">${budget.budget_spent.toLocaleString()}</p>
                     </div>
                     <div className="col-span-2 space-y-2">
                        <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                           <span>Progress</span>
                           <span>{Math.round((budget.budget_spent / budget.total_budget) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                           <div 
                             className="bg-blue-500 h-full rounded-full" 
                             style={{ width: `${Math.min((budget.budget_spent / budget.total_budget) * 100, 100)}%` }}
                           />
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="text-center text-slate-400">
                     <p>No budget set for this project.</p>
                  </div>
               )}
            </CardContent>
         </Card>

      </div>
    </div>
  );
};
