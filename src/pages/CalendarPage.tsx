import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw, Loader2, Filter, CalendarDays, CheckCircle2, Clock, Zap } from 'lucide-react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { CalendarEventCard } from '@/components/calendar/CalendarEventCard';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isTomorrow, addDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CalendarPage = () => {
  const showContent = useAnimateIn(false, 200);
  const { events, loading, fetchEvents, getTodayEvents } = useCalendarEvents();
  const [syncing, setSyncing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'today' | 'assignments'>('all');
  const [selectedCalendar, setSelectedCalendar] = useState<string>('all');
  const { toast } = useToast();

  const handleSync = async () => {
    try {
      setSyncing(true);
      const { data, error } = await supabase.functions.invoke('sync-google-calendar');

      if (error) throw error;

      toast({
        title: 'Calendar synced',
        description: `Synced ${data?.eventsCount || 0} events, ${data?.assignmentsDetected || 0} assignments detected`
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

  // Calculate stats
  const totalEvents = events.length;
  const todayEvents = getTodayEvents();
  const todayCount = todayEvents.length;
  const assignmentCount = events.filter(e => e.is_assignment).length;
  
  const upcomingCount = events.filter(e => {
    const eventDate = new Date(e.start_time);
    const nextWeek = addDays(new Date(), 7);
    return eventDate > new Date() && eventDate <= nextWeek;
  }).length;

  // Get unique calendars
  const uniqueCalendars = Array.from(
    new Set(events.map(e => e.metadata?.calendar_name || 'Unknown Calendar'))
  ).sort();

  // Filter events
  const filteredEvents = events.filter(event => {
    // Calendar filter
    if (selectedCalendar !== 'all') {
      const calendarName = event.metadata?.calendar_name || 'Unknown Calendar';
      if (calendarName !== selectedCalendar) return false;
    }

    // Status filter
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'assignments') return event.is_assignment;
    if (selectedFilter === 'today') return isToday(new Date(event.start_time));
    if (selectedFilter === 'upcoming') {
      const eventDate = new Date(event.start_time);
      const nextWeek = addDays(new Date(), 7);
      return eventDate > new Date() && eventDate <= nextWeek;
    }
    return true;
  });

  // Group events by date
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const date = format(startOfDay(new Date(event.start_time)), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  const sortedDates = Object.keys(groupedEvents).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground animate-pulse">Loading calendar events...</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 pt-24 px-4">
        <AnimatedTransition show={showContent} animation="fade">
          <div className="max-w-2xl mx-auto">
            <Card className="border-border/50 shadow-lg">
              <CardContent className="py-16 text-center space-y-6">
                <Calendar className="h-16 w-16 mx-auto text-primary animate-pulse" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">No calendar events found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Connect your Google Calendar in Settings and sync to see all your events here
                  </p>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => window.location.href = '/settings'} size="lg">
                    Go to Settings
                  </Button>
                  <Button variant="outline" onClick={handleSync} disabled={syncing} size="lg">
                    {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Sync Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </AnimatedTransition>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 pt-20">
      <AnimatedTransition show={showContent} animation="fade">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          {/* Hero Dashboard */}
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-background p-8 shadow-lg">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
            <div className="relative space-y-6">
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div className="space-y-3 flex-1 min-w-[300px]">
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent">
                    Calendar Events
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    {todayCount > 0 ? `📅 ${todayCount} events today - Stay organized!` : '✨ Your schedule at a glance'}
                  </p>
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <span>{totalEvents} total events</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span>{upcomingCount} upcoming</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>{assignmentCount} assignments</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10" />
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                  <SelectTrigger className="w-[200px] bg-background border-border">
                    <SelectValue placeholder="All Calendars" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="all">All Calendars ({totalEvents})</SelectItem>
                    {uniqueCalendars.map(calendar => {
                      const count = events.filter(e => 
                        (e.metadata?.calendar_name || 'Unknown Calendar') === calendar
                      ).length;
                      return (
                        <SelectItem key={calendar} value={calendar}>
                          {calendar} ({count})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="gap-2">
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Sync Calendar
                </>
              )}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card 
              onClick={() => setSelectedFilter('all')}
              className={cn(
                "cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-border/50",
                selectedFilter === 'all' && "ring-2 ring-primary shadow-lg bg-primary/5"
              )}
            >
              <CardContent className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <CalendarDays className="h-8 w-8 text-primary" />
                  <Badge variant="outline">{totalEvents}</Badge>
                </div>
                <p className="text-2xl font-bold">{totalEvents}</p>
                <p className="text-sm text-muted-foreground">All Events</p>
              </CardContent>
            </Card>

            <Card 
              onClick={() => setSelectedFilter('today')}
              className={cn(
                "cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-border/50",
                selectedFilter === 'today' && "ring-2 ring-blue-500 shadow-lg bg-blue-500/5"
              )}
            >
              <CardContent className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <Zap className="h-8 w-8 text-blue-500" />
                  <Badge className="bg-blue-500">{todayCount}</Badge>
                </div>
                <p className="text-2xl font-bold">{todayCount}</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </CardContent>
            </Card>

            <Card 
              onClick={() => setSelectedFilter('upcoming')}
              className={cn(
                "cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-border/50",
                selectedFilter === 'upcoming' && "ring-2 ring-amber-500 shadow-lg bg-amber-500/5"
              )}
            >
              <CardContent className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <Clock className="h-8 w-8 text-amber-500" />
                  <Badge className="bg-amber-500">{upcomingCount}</Badge>
                </div>
                <p className="text-2xl font-bold">{upcomingCount}</p>
                <p className="text-sm text-muted-foreground">Next 7 Days</p>
              </CardContent>
            </Card>

            <Card 
              onClick={() => setSelectedFilter('assignments')}
              className={cn(
                "cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-border/50",
                selectedFilter === 'assignments' && "ring-2 ring-green-500 shadow-lg bg-green-500/5"
              )}
            >
              <CardContent className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <Badge className="bg-green-500">{assignmentCount}</Badge>
                </div>
                <p className="text-2xl font-bold">{assignmentCount}</p>
                <p className="text-sm text-muted-foreground">Assignments</p>
              </CardContent>
            </Card>
          </div>

          {/* Events Timeline */}
          <div className="space-y-6">
            {sortedDates.map(date => {
              const dateObj = new Date(date);
              const dateLabel = isToday(dateObj) 
                ? 'Today' 
                : isTomorrow(dateObj)
                ? 'Tomorrow'
                : format(dateObj, 'EEEE, MMMM d, yyyy');

              return (
                <div key={date} className="space-y-4">
                  <h2 className="text-2xl font-bold sticky top-20 bg-background/95 backdrop-blur-sm py-2 z-10 border-b border-border/50">
                    {dateLabel}
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groupedEvents[date].map(event => (
                      <CalendarEventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AnimatedTransition>
    </div>
  );
};

export default CalendarPage;
