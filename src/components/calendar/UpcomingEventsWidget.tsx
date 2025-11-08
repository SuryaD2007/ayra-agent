import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { CalendarEventCard } from './CalendarEventCard';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const UpcomingEventsWidget = () => {
  const { getUpcomingEvents, getTodayEvents, loading, fetchEvents } = useCalendarEvents();
  const [syncing, setSyncing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const upcomingEvents = getUpcomingEvents(5);
  const todayEvents = getTodayEvents();

  const handleSync = async () => {
    try {
      setSyncing(true);
      const { data, error } = await supabase.functions.invoke('sync-google-calendar');

      if (error) throw error;

      toast({
        title: 'Calendar synced',
        description: `Synced ${data?.eventsCount || 0} events from Google Calendar`
      });

      await fetchEvents();
    } catch (error: any) {
      toast({
        title: 'Sync failed',
        description: error.message || 'Failed to sync calendar',
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (upcomingEvents.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Calendar Events
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming events. Sync your Google Calendar to see events here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Events
            </CardTitle>
            {todayEvents.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {todayEvents.length} today
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSync}
              disabled={syncing}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/calendar')}
              className="gap-1"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingEvents.map(event => (
          <CalendarEventCard key={event.id} event={event} compact />
        ))}
      </CardContent>
    </Card>
  );
};
