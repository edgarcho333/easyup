
import React, { useState } from 'react';
import { Idea, Platform } from '../../types';
import { ChevronLeft, ChevronRight, Facebook, Instagram, Linkedin, Twitter, Video, Image as ImageIcon, Calendar as CalendarIcon, LayoutGrid, GripVertical } from 'lucide-react';

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
    e.preventDefault(); // Necessary to allow dropping
    if (dragOverDate !== date) {
      setDragOverDate(date);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Optional: could verify if we are actually leaving the cell
    // setDragOverDate(null); 
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
      case 'facebook': return <Facebook className="h-3 w-3" />;
      case 'instagram': return <Instagram className="h-3 w-3" />;
      case 'linkedin': return <Linkedin className="h-3 w-3" />;
      case 'twitter': return <Twitter className="h-3 w-3" />;
      case 'tiktok': return <Video className="h-3 w-3" />;
      default: return <ImageIcon className="h-3 w-3" />;
    }
  };

  const getPlatformColor = (platform: Platform) => {
    switch (platform) {
      case 'facebook': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'instagram': return 'bg-pink-50 text-pink-600 border-pink-100';
      case 'linkedin': return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'tiktok': return 'bg-slate-900 text-white border-slate-800';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Header Title
  const getHeaderTitle = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    
    // Week View Title
    const start = calendarDays[0] as Date;
    const end = calendarDays[6] as Date;
    
    if (start.getMonth() === end.getMonth()) {
       return `${start.toLocaleString('default', { month: 'long' })} ${start.getFullYear()}`;
    }
    // Cross months
    return `${start.toLocaleString('default', { month: 'short', day: 'numeric' })} - ${end.toLocaleString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-240px)] min-h-[600px]">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-slate-200 gap-4">
        <div>
            <h3 className="text-xl font-bold text-slate-900">
              {getHeaderTitle()}
            </h3>
            <p className="text-sm text-slate-500">{viewMode === 'month' ? 'Monthly Schedule' : 'Weekly Overview'}</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* View Switcher */}
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

          {/* Navigation */}
          <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
            <button onClick={() => navigate('prev')} className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all"><ChevronLeft className="h-5 w-5 text-slate-600" /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-white hover:shadow-sm rounded-md transition-all">Today</button>
            <button onClick={() => navigate('next')} className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all"><ChevronRight className="h-5 w-5 text-slate-600" /></button>
          </div>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50 shrink-0">
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
          <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.substring(0, 3)}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className={`grid grid-cols-7 flex-1 bg-slate-100 gap-px overflow-y-auto ${viewMode === 'week' ? 'h-full' : 'auto-rows-fr'}`}>
        {calendarDays.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} className="bg-white/50 min-h-[100px]" />;
          
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
                    flex flex-col p-2 transition-colors group relative
                    ${viewMode === 'month' ? 'min-h-[100px]' : 'h-full min-h-[300px]'} 
                    ${isDragOver ? 'bg-blue-50 ring-inset ring-2 ring-primary-400 z-10' : 'bg-white'}
                    ${isToday ? 'bg-blue-50/30' : ''}
                `}
            >
              <div className="flex justify-between items-start shrink-0 mb-1">
                  <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 group-hover:text-slate-900'}`}>
                    {date.getDate()}
                  </span>
                  {dayIdeas.length > 0 && (
                      <span className="text-[10px] font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                          {dayIdeas.length}
                      </span>
                  )}
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                {dayIdeas.map(idea => {
                    const platform = idea.platforms[0] || 'facebook';
                    const style = getPlatformColor(platform);
                    const hasAsset = idea.assets && idea.assets.length > 0;
                    const thumbnail = hasAsset ? idea.assets![0].file_url : idea.reference_image_url;

                    return (
                        <div
                            key={idea.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, idea.id)}
                            onClick={() => onIdeaClick(idea)}
                            className={`
                                w-full text-left p-1.5 rounded-lg border shadow-sm hover:shadow-md transition-all flex items-center gap-2 group/card ${style} bg-white hover:border-current cursor-grab active:cursor-grabbing
                            `}
                        >
                            {thumbnail && (
                                <div className="h-8 w-8 rounded bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                                    <img src={thumbnail} alt="" className="h-full w-full object-cover" />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1 mb-0.5">
                                    {getPlatformIcon(platform)}
                                    <span className="text-[10px] font-bold uppercase opacity-75">{platform}</span>
                                </div>
                                <p className="text-xs font-medium truncate text-slate-900 leading-tight group-hover/card:text-primary-700">
                                    {idea.title}
                                </p>
                            </div>
                            <GripVertical className="h-3 w-3 text-slate-400" />
                        </div>
                    );
                })}
                
                {/* Add Idea Placeholder (Visual Helper when dragging empty slots) */}
                {viewMode === 'week' && dayIdeas.length === 0 && !isDragOver && (
                    <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span className="text-xs text-slate-400">+</span>
                    </div>
                )}
                
                {isDragOver && dayIdeas.length === 0 && (
                   <div className="h-full border-2 border-dashed border-primary-300 rounded-lg flex items-center justify-center bg-primary-50/50">
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
