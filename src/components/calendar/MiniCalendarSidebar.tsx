import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/hooks/useCalendarEvents';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MiniCalendarSidebarProps {
  selectedMonth: Date;
  events: CalendarEvent[];
  onMonthChange: (direction: 'prev' | 'next') => void;
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
}

export const MiniCalendarSidebar = ({
  selectedMonth,
  events,
  onMonthChange,
  onDateSelect,
  selectedDate
}: MiniCalendarSidebarProps) => {
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const getEventCount = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return isSameDay(eventDate, date);
    }).length;
  };

  const renderEventIndicator = (count: number) => {
    if (count === 0) return null;
    
    if (count <= 3) {
      return (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
          {Array.from({ length: count }).map((_, i) => (
            <div 
              key={i} 
              className="w-1 h-1 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      );
    }
    
    return (
      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-primary bg-primary/10 rounded-full w-3.5 h-3.5 flex items-center justify-center animate-pulse">
        {count > 9 ? '9+' : count}
      </div>
    );
  };

  return (
    <div className="w-64 shrink-0 sticky top-24 h-fit">
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-background/95 via-background/90 to-primary/5 backdrop-blur-xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-500">
        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              {format(selectedMonth, 'MMMM yyyy')}
            </h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMonthChange('prev')}
                className="h-7 w-7 hover:bg-primary/10 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMonthChange('next')}
                className="h-7 w-7 hover:bg-primary/10 transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, i) => (
              <div 
                key={i} 
                className="text-xs font-medium text-muted-foreground text-center h-7 flex items-center justify-center"
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-3">
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              const eventCount = getEventCount(day);
              const isCurrentMonth = isSameMonth(day, selectedMonth);
              const isSelectedDay = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              
              return (
                <button
                  key={i}
                  onClick={() => onDateSelect(day)}
                  disabled={!isCurrentMonth}
                  className={cn(
                    "relative h-9 w-full rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center",
                    "hover:bg-primary/10 hover:scale-105 hover:shadow-sm active:scale-95",
                    isCurrentMonth 
                      ? "text-foreground cursor-pointer" 
                      : "text-muted-foreground/30 cursor-not-allowed",
                    isTodayDate && isCurrentMonth && "bg-primary text-primary-foreground font-bold shadow-md ring-2 ring-primary/20",
                    isSelectedDay && !isTodayDate && "bg-primary/20 ring-2 ring-primary/30",
                    !isTodayDate && !isSelectedDay && isCurrentMonth && "hover:ring-1 hover:ring-primary/20"
                  )}
                  style={{
                    animationDelay: `${i * 10}ms`
                  }}
                >
                  <span className="relative z-10">{format(day, 'd')}</span>
                  {isCurrentMonth && renderEventIndicator(eventCount)}
                  
                  {/* Hover glow effect */}
                  {isCurrentMonth && (
                    <div className="absolute inset-0 bg-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer stats */}
        <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Events this month</span>
            <span className="font-semibold text-primary">
              {events.filter(e => isSameMonth(new Date(e.start_time), selectedMonth)).length}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Today</span>
            <span className="font-semibold text-foreground">
              {getEventCount(new Date())}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
