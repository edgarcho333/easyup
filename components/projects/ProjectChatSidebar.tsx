
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../services/chatService';
import { Conversation, Message } from '../../types';
import { X, Send, MessageSquare, Briefcase, Users, Loader2, Paperclip, File as FileIcon, Download } from 'lucide-react';
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
  const [attachment, setAttachment] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachment) || !user) return;
    
    const activeConv = activeTab === 'team' ? teamConv : clientConv;
    if (!activeConv) return;

    const content = input;
    const fileToSend = attachment;
    
    setInput('');
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      const msg = await chatService.sendMessage(activeConv.id, user.id, content, fileToSend || undefined);
      setMessages(prev => [...prev, msg]);
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  // Colors based on tab
  const themeColor = activeTab === 'team' ? 'blue' : 'purple';
  const bgLight = activeTab === 'team' ? 'bg-blue-50 dark:bg-slate-950' : 'bg-purple-50 dark:bg-slate-950';
  const buttonBg = activeTab === 'team' ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600' : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-600';

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
      <div className={`fixed top-0 right-0 h-full w-[380px] bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 dark:border-slate-800 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
           <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
             <MessageSquare className="h-5 w-5 text-slate-500 dark:text-slate-400" /> Project Chat
           </h3>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
             <X className="h-5 w-5" />
           </button>
        </div>

        {/* Tabs */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 shrink-0">
           <div className="flex bg-slate-200/60 dark:bg-slate-800 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('team')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'team' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                <Users className="h-3.5 w-3.5" /> Internal Team
              </button>
              <button 
                onClick={() => setActiveTab('client')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'client' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                <Briefcase className="h-3.5 w-3.5" /> Client Channel
              </button>
           </div>
           <p className={`text-[10px] text-center mt-2 font-medium ${activeTab === 'client' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'}`}>
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
                     <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${isMe ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-white' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 dark:text-white'}`}>
                        {msg.user?.full_name?.[0]}
                     </div>
                     <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${
                           isMe 
                             ? `${buttonBg} text-white rounded-tr-none` 
                             : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                        }`}>
                           {msg.attachment_url && (
                             <div className="mb-2">
                                {msg.attachment_type === 'image' ? (
                                  <img src={msg.attachment_url} alt="attachment" className="rounded-lg max-w-full max-h-48 object-cover border border-white/20" />
                                ) : (
                                  <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black/10 dark:bg-white/10 p-2 rounded-lg hover:bg-black/20 dark:hover:bg-white/20 transition-colors">
                                    <FileIcon className="h-4 w-4" />
                                    <span className="text-xs underline truncate max-w-[150px]">{msg.attachment_name || 'File'}</span>
                                    <Download className="h-3 w-3 ml-auto" />
                                  </a>
                                )}
                             </div>
                           )}
                           {msg.content && <p>{msg.content}</p>}
                        </div>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                           {msg.user?.full_name} • {new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </span>
                     </div>
                  </div>
                );
             })
           )}
           <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
           {attachment && (
             <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 mb-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-2 truncate">
                   <Paperclip className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                   <span className="truncate font-medium text-slate-700 dark:text-slate-200">{attachment.name}</span>
                </div>
                <button onClick={() => { setAttachment(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="text-slate-400 hover:text-red-500">
                   <X className="h-3.5 w-3.5" />
                </button>
             </div>
           )}
           <form onSubmit={handleSend} className="flex gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileSelect} 
              />
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                className="rounded-full h-10 w-10 shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => fileInputRef.current?.click()}
              >
                 <Paperclip className="h-4 w-4" />
              </Button>
              <input 
                className="flex-1 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 border rounded-full px-4 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all focus:ring-slate-300 dark:focus:ring-slate-600 dark:text-white dark:placeholder:text-slate-500"
                placeholder={`Message ${activeTab === 'team' ? 'team' : 'client'}...`}
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <Button 
                type="submit" 
                size="icon" 
                className={`rounded-full h-10 w-10 shrink-0 shadow-sm ${buttonBg} border-transparent`} 
                disabled={!input.trim() && !attachment}
              >
                 <Send className="h-4 w-4" />
              </Button>
           </form>
        </div>

      </div>
    </>
  );
};
