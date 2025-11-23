
import React, { useState, useEffect, useRef } from 'react';
import { Message, Conversation } from '../../types';
import { chatService } from '../../services/chatService';
import { Button } from '../ui/Button';
import { Send, Paperclip, MoreVertical, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ChatWindowProps {
  conversation: Conversation;
  onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    
    const content = input;
    setInput('');
    
    try {
      await chatService.sendMessage(conversation.id, user.id, content);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white w-full">
      {/* Header */}
      <div className="h-16 border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h3 className="font-bold text-slate-900">{conversation.name || 'Chat'}</h3>
            <p className="text-xs text-slate-500">{conversation.participants?.length || 0} participants</p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600"><MoreVertical className="h-5 w-5" /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50">
        {messages.map((msg, i) => {
           const isMe = msg.user_id === user?.id;
           return (
             <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
               <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold shrink-0">
                 {msg.user?.full_name?.[0]}
               </div>
               <div className={`max-w-[85%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                 <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                   <span className="text-xs font-medium text-slate-900">{msg.user?.full_name}</span>
                   <span className="text-[10px] text-slate-400">{new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                 </div>
                 <div className={`px-4 py-2 rounded-lg text-sm ${isMe ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                   {msg.content}
                 </div>
               </div>
             </div>
           );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <Button type="button" variant="ghost" size="icon" className="shrink-0 text-slate-400 hidden sm:flex">
             <Paperclip className="h-5 w-5" />
          </Button>
          <input 
            className="flex-1 bg-slate-50 border-0 rounded-full px-4 focus:ring-2 focus:ring-primary-500 outline-none min-w-0"
            placeholder="Type a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <Button type="submit" size="icon" className="rounded-full h-10 w-10 shrink-0" disabled={!input.trim()}>
             <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};