import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../services/chatService';
import { Conversation, Message } from '../../types';
import { X, Send, MessageSquare, Briefcase, Users, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProjectChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const ProjectChatSidebar: React.FC<ProjectChatSidebarProps> = ({ isOpen, onClose, projectId }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'team' | 'client'>('team');
  const [teamConv, setTeamConv] = useState<Conversation | null>(null);
  const [clientConv, setClientConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && projectId) {
      loadConversations();
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    const activeConv = activeTab === 'team' ? teamConv : clientConv;
    if (activeConv) {
      loadMessages(activeConv.id);
    } else {
      setMessages([]);
    }
  }, [activeTab, teamConv, clientConv]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const [team, client] = await Promise.all([
        chatService.getProjectConversation(projectId, 'project'),
        chatService.getProjectConversation(projectId, 'client')
      ]);
      setTeamConv(team);
      setClientConv(client);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const msgs = await chatService.getMessages(convId);
      setMessages(msgs);
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    
    const activeConv = activeTab === 'team' ? teamConv : clientConv;
    if (!activeConv) return;

    const content = input;
    setInput('');

    try {
      const msg = await chatService.sendMessage(activeConv.id, user.id, content);
      setMessages(prev => [...prev, msg]);
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  // Colors based on tab
  const themeColor = activeTab === 'team' ? 'blue' : 'purple';
  const bgLight = activeTab === 'team' ? 'bg-blue-50' : 'bg-purple-50';
  const textDark = activeTab === 'team' ? 'text-blue-900' : 'text-purple-900';
  const buttonBg = activeTab === 'team' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700';

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" 
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-[380px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
           <h3 className="font-bold text-slate-800 flex items-center gap-2">
             <MessageSquare className="h-5 w-5 text-slate-500" /> Project Chat
           </h3>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100">
             <X className="h-5 w-5" />
           </button>
        </div>

        {/* Tabs */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
           <div className="flex bg-slate-200/60 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('team')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'team' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Users className="h-3.5 w-3.5" /> Internal Team
              </button>
              <button 
                onClick={() => setActiveTab('client')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'client' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Briefcase className="h-3.5 w-3.5" /> Client Channel
              </button>
           </div>
           <p className={`text-[10px] text-center mt-2 font-medium ${activeTab === 'client' ? 'text-purple-600' : 'text-slate-400'}`}>
              {activeTab === 'client' ? '⚠️ Messages here are visible to the client.' : '🔒 Internal discussion only.'}
           </p>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${bgLight}`}>
           {isLoading ? (
             <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
           ) : (
             messages.map(msg => {
                const isMe = msg.user_id === user?.id;
                return (
                  <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                     <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${isMe ? 'bg-slate-100 border-slate-200' : 'bg-white border-slate-200'}`}>
                        {msg.user?.full_name?.[0]}
                     </div>
                     <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${
                           isMe 
                             ? `${buttonBg} text-white rounded-tr-none` 
                             : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                        }`}>
                           {msg.content}
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 px-1">
                           {msg.user?.full_name} • {new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </span>
                     </div>
                  </div>
                );
             })
           )}
           <div ref={scrollRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
           <form onSubmit={handleSend} className="flex gap-2">
              <input 
                className="flex-1 bg-slate-50 border-slate-200 border rounded-full px-4 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all focus:ring-slate-300"
                placeholder={`Message ${activeTab === 'team' ? 'team' : 'client'}...`}
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <Button 
                type="submit" 
                size="icon" 
                className={`rounded-full h-10 w-10 shrink-0 shadow-sm ${buttonBg} border-transparent`} 
                disabled={!input.trim()}
              >
                 <Send className="h-4 w-4" />
              </Button>
           </form>
        </div>

      </div>
    </>
  );
};