
import React, { useState, useEffect, useRef } from 'react';
import { Message, Conversation } from '../../types';
import { chatService } from '../../services/chatService';
import { Button } from '../ui/Button';
import { Send, Paperclip, MoreVertical, ArrowLeft, File as FileIcon, Download, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ChatWindowProps {
  conversation: Conversation;
  onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const data = await chatService.getMessages(conversation.id);
      setMessages(data);
      scrollToBottom();
    };
    load();
    
    const sub = chatService.subscribeToMessages(conversation.id, (msg) => {
       setMessages(prev => [...prev, msg]);
       scrollToBottom();
    });

    return () => { sub.unsubscribe(); };
  }, [conversation.id]);

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
    
    const content = input;
    const fileToSend = attachment;

    setInput('');
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    try {
      await chatService.sendMessage(conversation.id, user.id, content, fileToSend || undefined);
      // Messages updated via subscription usually, but for mock we might need to manually fetch or optimistically add
      const data = await chatService.getMessages(conversation.id);
      setMessages(data);
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 w-full transition-colors duration-300">
      {/* Header */}
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="md:hidden p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">{conversation.name || 'Chat'}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{conversation.participants?.length || 0} participants</p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><MoreVertical className="h-5 w-5" /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50 dark:bg-slate-950">
        {messages.map((msg, i) => {
           const isMe = msg.user_id === user?.id;
           return (
             <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
               <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                 {msg.user?.full_name?.[0]}
               </div>
               <div className={`max-w-[85%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                 <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                   <span className="text-xs font-medium text-slate-900 dark:text-slate-300">{msg.user?.full_name}</span>
                   <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                 </div>
                 <div className={`px-4 py-2 rounded-lg text-sm ${isMe ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none shadow-sm'}`}>
                   {msg.attachment_url && (
                     <div className="mb-2">
                        {msg.attachment_type === 'image' ? (
                          <img src={msg.attachment_url} alt="attachment" className="rounded-lg max-w-full max-h-60 object-cover border border-white/20" />
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
               </div>
             </div>
           );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
        {attachment && (
             <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 mb-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs max-w-md">
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
            className="shrink-0 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hidden sm:flex hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => fileInputRef.current?.click()}
          >
             <Paperclip className="h-5 w-5" />
          </Button>
          <input 
            className="flex-1 bg-slate-50 dark:bg-slate-800 border-0 dark:border dark:border-slate-700 rounded-full px-4 focus:ring-2 focus:ring-primary-500 outline-none min-w-0 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
            placeholder="Type a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <Button type="submit" size="icon" className="rounded-full h-10 w-10 shrink-0 shadow-sm" disabled={!input.trim() && !attachment}>
             <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
