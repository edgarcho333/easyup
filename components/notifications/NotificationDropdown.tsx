
import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, Check, CheckCircle, MessageSquare, Info, AlertCircle, Clock, AlertTriangle, Folder, Watch } from 'lucide-react';
import { NotificationType } from '../../types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string; // Optional filter for specific project
  variant?: 'global' | 'project'; // Mode: Global (System/Time/Org) vs Project (Tasks/Content)
  placement?: 'bottom-right' | 'top-left';
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose, projectId, variant = 'project', placement = 'bottom-right' }) => {
  const { notifications, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const getIcon = (type: NotificationType) => {
    switch(type) {
      case 'idea_approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'task_assigned': return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'mention': return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'task_due_soon': return <Clock className="h-4 w-4 text-amber-600" />;
      case 'task_overdue': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'timer_started': return <Watch className="h-4 w-4 text-indigo-600" />;
      case 'project_created': return <Folder className="h-4 w-4 text-blue-600" />;
      default: return <Info className="h-4 w-4 text-slate-500" />;
    }
  };

  const getBgColor = (type: NotificationType) => {
    switch(type) {
      case 'idea_approved': return 'bg-green-50';
      case 'task_assigned': return 'bg-blue-50';
      case 'mention': return 'bg-purple-50';
      case 'task_due_soon': return 'bg-amber-50';
      case 'task_overdue': return 'bg-red-50';
      case 'timer_started': return 'bg-indigo-50';
      case 'project_created': return 'bg-blue-50';
      default: return 'bg-slate-50';
    }
  };

  // Filter Logic
  const displayedNotifications = notifications.filter(n => {
    if (variant === 'global') {
      // Global view: Show System, Timer, Project Creation OR Notifications without a project_id
      return !n.project_id || ['system', 'timer_started', 'project_created'].includes(n.type);
    } else {
      // Project view: Show Project Specific types
      if (projectId) return n.project_id === projectId;
      // Fallback for generic "project" list if no ID provided
      return n.project_id && !['system', 'timer_started', 'project_created'].includes(n.type);
    }
  });

  const displayedUnreadCount = displayedNotifications.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  const positionClass = placement === 'top-left' 
    ? 'bottom-full left-0 mb-2 origin-bottom-left'
    : 'top-full right-0 mt-2 origin-top-right';

  return (
    <div 
      ref={dropdownRef}
      className={`absolute ${positionClass} w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200`}
    >
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
        <h3 className="font-bold text-slate-900">
            {variant === 'global' ? 'System Updates' : 'Project Notifications'}
        </h3>
        {displayedUnreadCount > 0 && (
          <button 
            onClick={() => markAllAsRead(projectId)} // Only works per project id if provided
            className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <Check className="h-3 w-3" /> Mark all read
          </button>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {isLoading && displayedNotifications.length === 0 ? (
           <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : displayedNotifications.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <div className="p-3 bg-slate-50 rounded-full mb-3">
                 <Bell className="h-6 w-6 opacity-20" />
              </div>
              <p className="text-sm">No notifications</p>
           </div>
        ) : (
           <div className="divide-y divide-slate-50">
             {displayedNotifications.map(notif => (
                <div 
                  key={notif.id} 
                  className={`p-4 hover:bg-slate-50 transition-colors relative group ${!notif.is_read ? 'bg-blue-50/30' : 'bg-white'}`}
                  onClick={() => { if(!notif.is_read) markAsRead(notif.id); }}
                >
                   <div className="flex gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${getBgColor(notif.type)}`}>
                         {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start">
                            <p className={`text-sm ${!notif.is_read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                               {notif.title}
                            </p>
                            {!notif.is_read && (
                               <span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            )}
                         </div>
                         <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                         <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-slate-400">{new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            {notif.link_url && (
                               <Link 
                                 to={notif.link_url} 
                                 onClick={() => { onClose(); markAsRead(notif.id); }}
                                 className="text-[10px] font-bold text-primary-600 hover:text-primary-700 hover:underline"
                               >
                                  View Details
                               </Link>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
             ))}
           </div>
        )}
      </div>
    </div>
  );
};
