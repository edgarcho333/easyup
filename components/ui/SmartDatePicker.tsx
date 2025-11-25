
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Sun, ArrowRight } from 'lucide-react';

interface SmartDatePickerProps {
  value?: string | null; // ISO string (YYYY-MM-DD)
  onChange: (date: string | null) => void;
  placeholder?: string;
  className?: string;
  align?: 'left' | 'right';
  variant?: 'button' | 'input';
}

export const SmartDatePicker: React.FC<SmartDatePickerProps> = ({ 
  value, 
  onChange, 
  placeholder = "Set due date",
  className = "",
  align = "left",
  variant = 'button'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calendar State
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const handleSelect = (d: Date) => {
    onChange(formatDate(d));
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setIsOpen(false);
  };

  const handleQuickSelect = (type: 'today' | 'tomorrow' | 'nextWeek' | 'noDate') => {
    const today = new Date();
    switch (type) {
      case 'today':
        handleSelect(today);
        break;
      case 'tomorrow':
        const tmrw = new Date(today);
        tmrw.setDate(today.getDate() + 1);
        handleSelect(tmrw);
        break;
      case 'nextWeek':
        const next = new Date(today);
        next.setDate(today.getDate() + 7);
        handleSelect(next);
        break;
      case 'noDate':
        onChange(null);
        setIsOpen(false);
        break;
    }
  };

  // Calendar Logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(viewDate);
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= days; i++) calendarDays.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  // Visual helpers
  const isToday = (d: Date) => new Date().toDateString() === d.toDateString();
  const isSelected = (d: Date) => value && new Date(value).toDateString() === d.toDateString();
  const isPast = (d: Date) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return d < today;
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)}>
        {variant === 'button' ? (
           <button 
             type="button"
             className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md font-medium transition-all border ${className}
               ${value 
                 ? (isPast(new Date(value)) && !isToday(new Date(value)) 
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-900/30' 
                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-900/30')
                 : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 hover:text-slate-700 dark:hover:text-slate-200'
               }`}
           >
             <CalendarIcon className="h-3.5 w-3.5" />
             <span>
               {value 
                 ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
                 : placeholder}
             </span>
             {value && (
               <span onClick={handleClear} className="ml-1 p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors">
                 <X className="h-3 w-3" />
               </span>
             )}
           </button>
        ) : (
           <div className={`relative cursor-pointer group ${className}`}>
              <div className="flex items-center w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm group-hover:border-primary-400 dark:group-hover:border-primary-500 transition-colors">
                  <CalendarIcon className="h-4 w-4 text-slate-400 mr-2" />
                  <span className={`flex-1 ${!value ? 'text-slate-400' : ''}`}>
                     {value ? new Date(value).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : placeholder}
                  </span>
                  {value && (
                    <span onClick={handleClear} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="h-3.5 w-3.5" />
                    </span>
                  )}
              </div>
           </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className={`absolute z-50 mt-2 w-[280px] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-left
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
        >
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-1 p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
             <button type="button" onClick={() => handleQuickSelect('today')} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all text-left">
                <Sun className="h-3.5 w-3.5 text-orange-500" /> Today
             </button>
             <button type="button" onClick={() => handleQuickSelect('tomorrow')} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all text-left">
                <ArrowRight className="h-3.5 w-3.5 text-blue-500" /> Tomorrow
             </button>
             <button type="button" onClick={() => handleQuickSelect('nextWeek')} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all text-left">
                <CalendarIcon className="h-3.5 w-3.5 text-purple-500" /> Next Week
             </button>
             <button type="button" onClick={() => handleQuickSelect('noDate')} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-red-600 dark:hover:text-red-400 hover:shadow-sm rounded-lg transition-all text-left">
                <X className="h-3.5 w-3.5" /> No Date
             </button>
          </div>

          {/* Calendar Header */}
          <div className="flex items-center justify-between p-3 pb-1">
            <button type="button" onClick={prevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400"><ChevronRight className="h-4 w-4" /></button>
          </div>

          {/* Calendar Grid */}
          <div className="p-3 pt-1">
             <div className="grid grid-cols-7 mb-1">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                   <div key={d} className="text-[10px] font-bold text-slate-400 text-center py-1">{d}</div>
                ))}
             </div>
             <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, i) => {
                   if (!date) return <div key={`empty-${i}`} />;
                   const today = isToday(date);
                   const selected = isSelected(date);
                   const past = isPast(date) && !today;

                   return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelect(date)}
                        className={`
                           h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all
                           ${selected 
                              ? 'bg-primary-600 text-white shadow-md scale-105' 
                              : today 
                                 ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-bold border border-primary-200 dark:border-primary-800'
                                 : past
                                    ? 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-500 dark:hover:text-slate-400'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                           }
                        `}
                      >
                        {date.getDate()}
                      </button>
                   );
                })}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
