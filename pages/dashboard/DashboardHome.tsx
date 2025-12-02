
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { organizationService } from '../../services/organizationService';
import { Invitation } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TrendingUp, Users, Calendar, BarChart3, Mail, Check, Loader2 } from 'lucide-react';

export const DashboardHome: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvites = async () => {
      if (user?.email) {
        try {
          const invites = await organizationService.getUserInvitations(user.email);
          setPendingInvites(invites);
        } catch (err) {
          console.error("Failed to fetch invitations", err);
        }
      }
    };

    fetchInvites();
  }, [user]);

  const handleAcceptInvite = async (invitationId: string) => {
    if (!user) return;
    setIsAccepting(invitationId);
    try {
      await organizationService.acceptInvitation(invitationId, user.id);
      // Remove from list
      setPendingInvites(prev => prev.filter(i => i.id !== invitationId));
      addToast('Invitation accepted successfully!', 'success');
      // Refresh profile to update organization list
      await refreshProfile();
      // Reload to ensure all context is updated
      window.location.reload();
    } catch (err) {
      console.error("Failed to accept invitation", err);
      addToast('Failed to accept invitation. Please try again.', 'error');
    } finally {
      setIsAccepting(null);
    }
  };

  const stats = [
    { title: "Active Campaigns", value: "12", icon: TrendingUp, change: "+2.5%", color: "text-green-600 dark:text-green-400" },
    { title: "Total Clients", value: "24", icon: Users, change: "+4 this month", color: "text-blue-600 dark:text-blue-400" },
    { title: "Scheduled Posts", value: "148", icon: Calendar, change: "12 due today", color: "text-orange-600 dark:text-orange-400" },
    { title: "Engagement Rate", value: "4.8%", icon: BarChart3, change: "+0.4%", color: "text-purple-600 dark:text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Overview for <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.currentOrganization?.name || 'Your Account'}</span>
          </p>
        </div>
        {user?.currentOrganization && (
          <div className="flex gap-2">
             <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
               {user?.currentRole?.replace('_', ' ')} View
             </span>
          </div>
        )}
      </div>

      {/* Pending Invitations Alert */}
      {pendingInvites.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            Pending Invitations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-primary-100 dark:border-primary-900 shadow-sm flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary-500"></div>
                <div>
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold uppercase tracking-wider">Invitation</p>
                  <h4 className="font-bold text-slate-900 dark:text-white text-lg">{invite.organization?.name}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Role: <span className="font-medium text-slate-700 dark:text-slate-300">{invite.role?.display_name}</span></p>
                  {invite.inviter && (
                    <p className="text-xs text-slate-400 mt-1">Invited by {invite.inviter.full_name}</p>
                  )}
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleAcceptInvite(invite.id)}
                  className="w-full mt-auto bg-green-600 hover:bg-green-700 text-white border-transparent"
                  isLoading={isAccepting === invite.id}
                >
                  <Check className="ml-2 h-3 w-3" /> Accept Invitation
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="flex flex-col mt-2">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="text-green-600 dark:text-green-400 font-medium">{stat.change}</span> from last month
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Content Area Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <Card className="lg:col-span-2 xl:col-span-3 dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300 text-xs font-bold">
                    AD
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-200">Alex Designer updated "Summer Sale" assets</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300">
              + New Campaign
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300">
              + Invite Team Member
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300">
              View Analytics Report
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
