
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { timeService } from '../../services/timeService';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { 
  Home, 
  Search, 
  Clock, 
  Square, 
  Bell, 
  Moon, 
  Sun,
  Loader2
} from 'lucide-react';

export const BottomDock: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { globalUnreadCount } = useNotifications();
  const { user } = useAuth();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeTimer, setActiveTimer] = useState<any>(null);
  const [isLoadingTime, setIsLoadingTime] = useState(false);

  // Polling for active timer status
  useEffect(() => {
    let interval: any;
    if (user) {
      const checkTime = async () => {
        const log = await timeService.getActiveLog(user.id);
        setActiveTimer(log);
      };
      checkTime();
      interval = setInterval(checkTime, 5000);
    }
    return () => clearInterval(interval);
  }, [user]);

  const handleTimeToggle = async () => {
    if (!user?.currentOrganization) return;
    setIsLoadingTime(true);
    try {
      if (activeTimer) {
        await timeService.stopTimer(activeTimer.id);
        setActiveTimer(null);
      } else {
        const newLog = await timeService.startTimer(
          user.id, 
          user.currentOrganization.id, 
          "Quick Session"
        );
        setActiveTimer(newLog);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingTime(false);
    }
  };

  const navItemClass = "p-3 rounded-full transition-all duration-300 hover:scale-110 focus:outline-none relative group";
  const activeClass = "bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-300";
  const inactiveClass = "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700";

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
      
      {/* Notification Popover - Positioned Above - GLOBAL VARIANT */}
      {isNotifOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-80 sm:w-96 origin-bottom">
           <NotificationDropdown isOpen={true} onClose={() => setIsNotifOpen(false)} variant="global" placement="top-left" />
        </div>
      )}

      <div className="flex items-center gap-2 px-2 py-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xl dark:shadow-black/50 rounded-full ring-1 ring-black/5 dark:ring-white/5">
        
        {/* Home */}
        <button 
          onClick={() => navigate('/')}
          className={`${navItemClass} ${location.pathname === '/' ? activeClass : inactiveClass}`}
          title="Home"
        >
          <Home className="h-6 w-6" />
        </button>

        {/* Search (Projects) */}
        <button 
          onClick={() => navigate('/projects')}
          className={`${navItemClass} ${location.pathname.includes('/projects') ? activeClass : inactiveClass}`}
          title="Projects"
        >
          <Search className="h-6 w-6" />
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Time Tracker Toggle */}
        <button 
          onClick={handleTimeToggle}
          disabled={isLoadingTime}
          className={`${navItemClass} ${activeTimer ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 'hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400'} text-slate-500 dark:text-slate-400`}
          title={activeTimer ? "Stop Timer" : "Start Timer"}
        >
          {isLoadingTime ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : activeTimer ? (
            <>
              <Square className="h-6 w-6 fill-current" />
              <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </>
          ) : (
            <Clock className="h-6 w-6" />
          )}
        </button>

        {/* Global Notifications */}
        <button 
          onClick={() => setIsNotifOpen(!isNotifOpen)}
          className={`${navItemClass} ${isNotifOpen ? activeClass : inactiveClass}`}
          title="Global Notifications"
        >
          <Bell className="h-6 w-6" />
          {globalUnreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-900 font-bold">
              {globalUnreadCount > 9 ? '9+' : globalUnreadCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Dark Mode */}
        <button 
          onClick={toggleTheme}
          className={`${navItemClass} ${theme === 'dark' ? 'text-purple-400 hover:bg-slate-800 dark:bg-purple-900/20' : 'text-orange-500 hover:bg-orange-50'}`}
          title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === 'light' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
        </button>

      </div>
    </div>
  );
};
