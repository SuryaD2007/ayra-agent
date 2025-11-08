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
    <Card className="border-border/50 hover:shadow-lg transition-all duration-300 group">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {event.is_assignment && (
                <Badge className="bg-primary">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Assignment
                </Badge>
              )}
              {event.is_recurring && (
                <Badge variant="outline">Recurring</Badge>
              )}
              {event.is_all_day && (
                <Badge variant="secondary">All Day</Badge>
              )}
              <Badge variant="outline" className={cn("text-xs", getStatusColor())}>
                {getTimeUntil()}
              </Badge>
            </div>
            <CardTitle className="text-xl group-hover:text-primary transition-colors">
              {event.summary}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              {getCalendarName()}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(event.html_link, '_blank')}
            className="flex-shrink-0"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>
            {event.is_all_day 
              ? format(startDate, 'EEEE, MMMM d, yyyy')
              : `${format(startDate, 'EEE, MMM d, h:mm a')} - ${format(endDate, 'h:mm a')}`
            }
          </span>
        </div>

        {event.location && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{event.location}</span>
          </div>
        )}

        {event.description && (
          <div className="text-sm text-muted-foreground line-clamp-3 pt-2 border-t border-border/50">
            {event.description}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
