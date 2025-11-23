
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../services/chatService';
import { Conversation } from '../../types';
import { ChatSidebar } from '../../components/chat/ChatSidebar';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { MessageSquare } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.currentOrganization) {
      chatService.getConversations(user.id, user.currentOrganization.id)
        .then(data => {
           setConversations(data);
           // On desktop, select first chat by default. On mobile, start with none (list view)
           if (window.innerWidth >= 768 && data.length > 0) {
             setActiveId(data[0].id);
           }
        })
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  if (isLoading) return <div className="h-[calc(100vh-64px)] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;

  const activeConversation = conversations.find(c => c.id === activeId);

  return (
    <div className="h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex relative">
      {/* Sidebar: Hidden on mobile if chat active */}
      <div className={`w-full md:w-80 border-r border-slate-200 bg-white flex flex-col h-full ${activeId ? 'hidden md:flex' : 'flex'}`}>
        <ChatSidebar 
          conversations={conversations} 
          activeId={activeId} 
          onSelect={setActiveId} 
          currentUserId={user?.id || ''}
        />
      </div>

      {/* Window: Hidden on mobile if no chat active */}
      <div className={`flex-1 h-full ${!activeId ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation ? (
          <ChatWindow 
            conversation={activeConversation} 
            onBack={() => setActiveId(null)}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 w-full">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-slate-300" />
             </div>
             <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};