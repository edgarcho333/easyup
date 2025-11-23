
import React from 'react';
import { Conversation } from '../../types';
import { User, Users, Briefcase, Search } from 'lucide-react';

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  currentUserId: string;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ conversations, activeId, onSelect, currentUserId }) => {
  
  const getIcon = (type: string) => {
    switch(type) {
      case 'dm': return <User className="h-4 w-4" />;
      case 'client': return <Briefcase className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getName = (c: Conversation) => {
    if (c.type === 'dm') {
       const other = c.participants?.find(p => p.id !== currentUserId);
       return other?.full_name || 'Unknown User';
    }
    return c.name || 'Untitled Chat';
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4 border-b border-slate-100 shrink-0">
         <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
           <input className="w-full pl-9 pr-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-lg text-sm transition-all" placeholder="Search chats..." />
         </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.map(c => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full flex items-center p-4 hover:bg-slate-50 transition-colors border-l-4 ${activeId === c.id ? 'border-primary-500 bg-primary-50/50' : 'border-transparent'}`}
          >
             <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${c.type === 'client' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                {getIcon(c.type)}
             </div>
             <div className="ml-3 text-left overflow-hidden flex-1 min-w-0">
               <p className={`text-sm font-medium truncate ${activeId === c.id ? 'text-primary-900' : 'text-slate-900'}`}>{getName(c)}</p>
               <p className="text-xs text-slate-500 truncate">
                  {c.type === 'client' ? 'Client Communication' : 'Team Chat'}
               </p>
             </div>
             {c.unread_count && c.unread_count > 0 && (
               <span className="ml-auto bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                 {c.unread_count}
               </span>
             )}
          </button>
        ))}
      </div>
    </div>
  );
};