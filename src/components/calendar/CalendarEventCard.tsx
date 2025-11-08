import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, ExternalLink, BookOpen, Video } from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/hooks/useCalendarEvents';

interface CalendarEventCardProps {
  event: CalendarEvent;
  compact?: boolean;
}

export const CalendarEventCard = ({ event, compact = false }: CalendarEventCardProps) => {
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  const now = new Date();
  
  const getTimeUntil = () => {
    const minutesUntil = differenceInMinutes(startDate, now);
    const hoursUntil = differenceInHours(startDate, now);
    const daysUntil = differenceInDays(startDate, now);
    
    if (minutesUntil < 0) return 'In progress';
    if (minutesUntil < 60) return `In ${minutesUntil}m`;
    if (hoursUntil < 24) return `In ${hoursUntil}h`;
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    return `In ${daysUntil}d`;
  };

  const getStatusColor = () => {
    const minutesUntil = differenceInMinutes(startDate, now);
    const hoursUntil = differenceInHours(startDate, now);
    
    if (minutesUntil < 0) return 'bg-blue-500';
    if (hoursUntil < 1) return 'bg-red-500';
    if (hoursUntil < 24) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getCalendarName = () => {
    if (!event.metadata?.calendar_name) return 'Calendar';
    return event.metadata.calendar_name;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/5 transition-all group">
        <div className="flex-shrink-0">
          <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {event.is_assignment && (
              <Badge variant="outline" className="text-xs">Assignment</Badge>
            )}
            <span className="text-xs text-muted-foreground">{getTimeUntil()}</span>
          </div>
          <p className="font-medium truncate">{event.summary}</p>
          <p className="text-sm text-muted-foreground truncate">
            {format(startDate, 'MMM d, h:mm a')}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => window.open(event.html_link, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Status indicator bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-1", getStatusColor())} />
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {event.is_assignment && (
                <Badge className="bg-primary shadow-sm">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Assignment
                </Badge>
              )}
              {event.is_recurring && (
                <Badge variant="outline" className="border-border/50">Recurring</Badge>
              )}
              {event.is_all_day && (
                <Badge variant="secondary">All Day</Badge>
              )}
              <Badge variant="outline" className={cn("text-xs font-medium shadow-sm", getStatusColor())}>
                {getTimeUntil()}
              </Badge>
            </div>
            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors duration-300 leading-tight">
              {event.summary}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-sm">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Calendar className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="font-medium">{getCalendarName()}</span>
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(event.html_link, '_blank')}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary/10"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 relative pb-6">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 backdrop-blur-sm">
          <div className="p-2 rounded-md bg-background/80">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium">
            {event.is_all_day 
              ? format(startDate, 'EEEE, MMMM d, yyyy')
              : `${format(startDate, 'EEE, MMM d, h:mm a')} - ${format(endDate, 'h:mm a')}`
            }
          </span>
        </div>

        {event.location && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 backdrop-blur-sm">
            <div className="p-2 rounded-md bg-background/80 flex-shrink-0">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm line-clamp-2 font-medium">{event.location}</span>
          </div>
        )}

        {event.description && (
          <div className="text-sm text-muted-foreground line-clamp-3 pt-3 border-t border-border/50 leading-relaxed">
            {event.description}
          </div>
        )}
      </CardContent>
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>
    </Card>
  );
};
