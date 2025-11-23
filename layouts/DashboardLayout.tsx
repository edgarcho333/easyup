
import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { OrganizationSwitcher } from '../components/org/OrganizationSwitcher';
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Building2,
  Sparkles,
  FolderKanban,
  MessageSquare,
  BarChart3,
  CheckSquare,
  ChevronRight
} from 'lucide-react';

interface DashboardLayoutProps {
  children?: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const location = useLocation();

  // Determine if we should be in expanded mode (Mobile always full width when open, Desktop depends on hover)
  const isExpanded = isSidebarHovered;

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'My Tasks', href: '/my-tasks', icon: CheckSquare },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Organization', href: '/org-settings', icon: Building2 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
     if (path === '/' && location.pathname === '/') return true;
     if (path !== '/' && location.pathname.startsWith(path)) return true;
     return false;
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-br from-primary-600 to-indigo-600 p-1.5 rounded-lg shadow-sm">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">EASYUP</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div className="flex h-screen overflow-hidden">
        {/* 
           Desktop Sidebar 
           - Fixed width placeholder (w-20) to reserve space in flow
           - Absolute/Fixed actual sidebar that expands on hover over content
        */}
        <div className="hidden lg:block w-[88px] shrink-0" /> {/* Spacer */}

        <div 
          className={`
            fixed inset-y-0 left-0 z-50 bg-white/90 backdrop-blur-xl border-r border-slate-200/80
            transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] flex flex-col
            ${isMobileMenuOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
            ${isExpanded ? 'lg:w-72 lg:shadow-2xl lg:shadow-slate-200/50' : 'lg:w-[88px]'}
          `}
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
        >
          {/* Logo Area */}
          <div className={`h-20 flex items-center ${isExpanded ? 'px-6' : 'justify-center px-2'} transition-all duration-300 border-b border-slate-100/50`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-gradient-to-br from-primary-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-primary-500/20 shrink-0">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className={`font-bold text-xl text-slate-900 tracking-tight transition-opacity duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                EASYUP
              </span>
            </div>
          </div>

          {/* Organization Selector */}
          <div className="p-4">
            <OrganizationSwitcher collapsed={!isExpanded && !isMobileMenuOpen} />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto custom-scrollbar">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    group flex items-center relative px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    ${active 
                      ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                    ${!isExpanded && !isMobileMenuOpen ? 'justify-center' : ''}
                  `}
                >
                  <Icon 
                    className={`
                      h-6 w-6 shrink-0 transition-colors duration-200
                      ${active ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}
                    `} 
                  />
                  
                  {/* Label */}
                  <span 
                    className={`
                      ml-3 whitespace-nowrap transition-all duration-300 origin-left
                      ${isExpanded || isMobileMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0 overflow-hidden absolute left-14'}
                    `}
                  >
                    {item.name}
                  </span>

                  {/* Active Indicator Dot (Only when expanded) */}
                  {active && (isExpanded || isMobileMenuOpen) && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  )}

                  {/* Tooltip for Collapsed State */}
                  {!isExpanded && !isMobileMenuOpen && (
                    <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl translate-x-2 group-hover:translate-x-0">
                      {item.name}
                      {/* Tiny arrow */}
                      <div className="absolute top-1/2 right-full -mt-1 -mr-1 border-4 border-transparent border-r-slate-900" />
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-slate-100/80 bg-slate-50/50">
            <div className={`flex items-center ${isExpanded || isMobileMenuOpen ? 'gap-3' : 'justify-center'} transition-all duration-300`}>
              <div className="relative shrink-0">
                <img 
                  src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name}`} 
                  alt="User" 
                  className="h-10 w-10 rounded-full bg-white border-2 border-white shadow-sm object-cover"
                />
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
              </div>
              
              <div className={`flex-1 min-w-0 overflow-hidden transition-all duration-300 ${isExpanded || isMobileMenuOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                <p className="text-sm font-bold text-slate-900 truncate">{user?.full_name}</p>
                <p className="text-xs text-slate-500 truncate capitalize">{user?.currentRole?.replace('_', ' ') || 'Member'}</p>
              </div>

              {(isExpanded || isMobileMenuOpen) && (
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto h-full relative z-0">
          <div className="w-full h-full p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
