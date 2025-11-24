
import React, { useState } from 'react';
import { Idea, Platform } from '../../types';
import { ChevronLeft, ChevronRight, Facebook, Instagram, Linkedin, Twitter, Video, Image as ImageIcon, Calendar as CalendarIcon, LayoutGrid, GripVertical, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface ContentCalendarProps {
  ideas: Idea[];
  onIdeaClick: (idea: Idea) => void;
  onReschedule?: (ideaId: string, newDate: string) => Promise<void>;
}

export const ContentCalendar: React.FC<ContentCalendarProps> = ({ ideas, onIdeaClick, onReschedule }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  // Navigation Logic
  const navigate = (direction: 'prev' | 'next') => {
    const val = direction === 'next' ? 1 : -1;
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + val, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + (val * 7));
      setCurrentDate(d);
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, ideaId: string) => {
    e.dataTransfer.setData('text/plain', ideaId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, date: string) => {
    e.preventDefault();
    if (dragOverDate !== date) {
      setDragOverDate(date);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Optional: verify leaving logic
  };

  const handleDrop = async (e: React.DragEvent, dateString: string) => {
    e.preventDefault();
    setDragOverDate(null);
    const ideaId = e.dataTransfer.getData('text/plain');
    
    if (ideaId && onReschedule) {
      await onReschedule(ideaId, dateString);
    }
  };

  // Generate Calendar Grid Data
  let calendarDays: (Date | null)[] = [];
  
  if (viewMode === 'month') {
    const { days, firstDay } = getDaysInMonth(currentDate);
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(null);
    }
    for (let i = 1; i <= days; i++) {
      calendarDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }
  } else {
    const startOfWeek = getStartOfWeek(currentDate);
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      calendarDays.push(d);
    }
  }

  const getIdeasForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return ideas.filter(i => i.planned_post_date === dateString);
  };

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'facebook': return <Facebook className="h-3.5 w-3.5 text-blue-600" />;
      case 'instagram': return <Instagram className="h-3.5 w-3.5 text-pink-600" />;
      case 'linkedin': return <Linkedin className="h-3.5 w-3.5 text-sky-700" />;
      case 'twitter': return <Twitter className="h-3.5 w-3.5 text-sky-500" />;
      case 'tiktok': return <Video className="h-3.5 w-3.5 text-slate-900" />;
      default: return <ImageIcon className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  const getPlatformGradient = (platform: Platform) => {
    switch (platform) {
      case 'facebook': return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200';
      case 'instagram': return 'bg-gradient-to-br from-pink-50 to-orange-50 border-pink-200';
      case 'linkedin': return 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200';
      case 'tiktok': return 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-300';
      default: return 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200';
    }
  };

  const getHeaderTitle = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    const start = calendarDays[0] as Date;
    const end = calendarDays[6] as Date;
    if (start.getMonth() === end.getMonth()) {
       return `${start.toLocaleString('default', { month: 'long' })} ${start.getFullYear()}`;
    }
    return `${start.toLocaleString('default', { month: 'short', day: 'numeric' })} - ${end.toLocaleString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-180px)] min-h-[600px]">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-slate-200 gap-4 bg-white relative z-20">
        <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {getHeaderTitle()}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">{viewMode === 'month' ? 'Monthly Content Overview' : 'Weekly Detail View'}</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
             <button 
               onClick={() => setViewMode('month')}
               className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <CalendarIcon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Month</span>
             </button>
             <button 
               onClick={() => setViewMode('week')}
               className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <LayoutGrid className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Week</span>
             </button>
          </div>

          <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
            <button onClick={() => navigate('prev')} className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all"><ChevronLeft className="h-5 w-5 text-slate-600" /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-white hover:shadow-sm rounded-md transition-all">Today</button>
            <button onClick={() => navigate('next')} className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all"><ChevronRight className="h-5 w-5 text-slate-600" /></button>
          </div>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 shrink-0 backdrop-blur-sm z-10">
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
          <div key={day} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.substring(0, 3)}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className={`grid grid-cols-7 flex-1 bg-slate-100/50 gap-px overflow-y-auto ${viewMode === 'week' ? 'h-full' : 'auto-rows-fr'}`}>
        {calendarDays.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} className="bg-white min-h-[140px]" />;
          
          const dayIdeas = getIdeasForDate(date);
          const isToday = new Date().toDateString() === date.toDateString();
          const dateString = date.toISOString().split('T')[0];
          const isDragOver = dragOverDate === dateString;

          return (
            <div 
                key={dateString}
                onDragOver={(e) => handleDragOver(e, dateString)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, dateString)}
                className={`
                    flex flex-col p-2 transition-all group relative
                    ${viewMode === 'month' ? 'min-h-[140px]' : 'h-full min-h-[300px]'} 
                    ${isDragOver ? 'bg-blue-50 ring-inset ring-2 ring-primary-400 z-10' : 'bg-white hover:bg-slate-50/50'}
                    ${isToday ? 'bg-blue-50/20' : ''}
                `}
            >
              {/* Date Indicator */}
              <div className="flex justify-end mb-2">
                  <span className={`text-xs font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 group-hover:text-slate-700'}`}>
                    {date.getDate()}
                  </span>
              </div>
              
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar px-0.5 pb-1">
                {dayIdeas.map(idea => {
                    const platform = idea.platforms[0] || 'facebook';
                    const hasAsset = idea.assets && idea.assets.length > 0;
                    const thumbnail = hasAsset ? idea.assets![0].file_url : idea.reference_image_url;
                    const isPublished = idea.status === 'published';
                    
                    return (
                        <div
                            key={idea.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, idea.id)}
                            onClick={() => onIdeaClick(idea)}
                            className={`
                                relative w-full aspect-[16/10] rounded-xl border shadow-sm hover:shadow-xl transition-all duration-300 cursor-grab active:cursor-grabbing overflow-hidden group/card transform hover:-translate-y-1
                                ${thumbnail ? 'border-transparent' : getPlatformGradient(platform)}
                            `}
                        >
                            {/* Background Image */}
                            {thumbnail ? (
                                <>
                                  <img src={thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105" />
                                  <div className="absolute inset-0 bg-black/10 group-hover/card:bg-black/30 transition-colors" />
                                </>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                   {getPlatformIcon(platform)}
                                </div>
                            )}

                            {/* Platform Icon Badge (Top Left) - White rounded square */}
                            <div className="absolute top-2 left-2 bg-white p-1.5 rounded-lg shadow-sm z-10 flex items-center justify-center h-7 w-7">
                                {getPlatformIcon(platform)}
                            </div>

                            {/* Status/Type Icon (Bottom Right) */}
                            <div className="absolute bottom-2 right-2 z-10">
                                {isPublished ? (
                                   <div className="bg-green-500 text-white p-1 rounded-full shadow-sm">
                                      <CheckCircle2 className="h-3 w-3" />
                                   </div>
                                ) : (
                                   <div className="bg-white/90 text-slate-600 px-1.5 py-0.5 rounded-md shadow-sm backdrop-blur-sm text-[10px] font-bold uppercase tracking-wide">
                                      {idea.post_type}
                                   </div>
                                )}
                            </div>

                            {/* Hover Info Overlay */}
                            <div className="absolute inset-0 p-3 flex flex-col justify-center items-center text-center opacity-0 group-hover/card:opacity-100 transition-opacity z-20 backdrop-blur-[2px] bg-black/40">
                                <span className="text-xs font-bold line-clamp-3 text-white drop-shadow-md">
                                   {idea.title}
                                </span>
                            </div>
                        </div>
                    );
                })}
                
                {/* Drop Zone Visual */}
                {isDragOver && dayIdeas.length === 0 && (
                   <div className="h-full border-2 border-dashed border-primary-300 rounded-lg flex items-center justify-center bg-primary-50/50 m-1">
                      <span className="text-xs text-primary-600 font-medium">Drop here</span>
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
