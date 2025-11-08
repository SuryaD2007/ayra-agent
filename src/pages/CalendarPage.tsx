import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw, Loader2, CalendarDays, CheckCircle2, Clock, Zap, Sparkles, TrendingUp, ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { CalendarEventCard } from '@/components/calendar/CalendarEventCard';
import { MiniCalendarSidebar } from '@/components/calendar/MiniCalendarSidebar';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isTomorrow, addDays, startOfDay, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';

const CalendarPage = () => {
  const showContent = useAnimateIn(false, 200);
  const { events, loading, fetchEvents, getTodayEvents } = useCalendarEvents();
  const [syncing, setSyncing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'today' | 'assignments'>('all');
  const [selectedCalendar, setSelectedCalendar] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [showJumpToToday, setShowJumpToToday] = useState(false);
  const todaySectionRef = useRef<HTMLDivElement>(null);
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

  // Auto-scroll to today's events on load
  useEffect(() => {
    if (!loading && todaySectionRef.current) {
      setTimeout(() => {
        todaySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  }, [loading]);

  // Show/hide jump to today button based on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (todaySectionRef.current) {
        const rect = todaySectionRef.current.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        setShowJumpToToday(!isVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const jumpToToday = () => {
    todaySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedMonth(date);
      // Find the section for this date and scroll to it (at the top, not center)
      const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
      const section = document.getElementById(`date-section-${dateStr}`);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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

  // Filter events by selected month
  const filteredEvents = events.filter(event => {
    // Calendar filter
    if (selectedCalendar !== 'all') {
      const calendarName = (event.metadata as any)?.calendar_name || 'Unknown Calendar';
      if (calendarName !== selectedCalendar) return false;
    }

    // Month filter - only show events in selected month
    const eventDate = new Date(event.start_time);
    if (!isSameMonth(eventDate, selectedMonth)) return false;

    // Status filter
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'assignments') return event.is_assignment;
    if (selectedFilter === 'today') return isToday(eventDate);
    if (selectedFilter === 'upcoming') {
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
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
        <div className="text-center space-y-6 relative z-10">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full animate-pulse" />
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto relative" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Loading your calendar</p>
            <p className="text-sm text-muted-foreground animate-pulse">Syncing events...</p>
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background pt-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
        <AnimatedTransition show={showContent} animation="fade">
          <div className="max-w-2xl mx-auto relative z-10">
            <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-background/95 hover:shadow-primary/20 transition-all duration-500">
              <CardContent className="py-20 text-center space-y-8">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                  <Calendar className="h-20 w-20 mx-auto text-primary relative animate-float" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent">
                    No calendar events found
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto text-lg">
                    Connect your Google Calendar in Settings and sync to see all your events here
                  </p>
                </div>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Button 
                    onClick={() => window.location.href = '/settings'} 
                    size="lg"
                    className="group relative overflow-hidden"
                  >
                    <span className="relative z-10">Go to Settings</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleSync} 
                    disabled={syncing} 
                    size="lg"
                    className="hover:border-primary/50 transition-all duration-300"
                  >
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/[0.02] to-background pt-20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(white,transparent_85%)]" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <AnimatedTransition show={showContent} animation="fade">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 relative z-10">
          {/* Premium Hero Dashboard */}
          <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/10 via-background/95 to-background/95 backdrop-blur-xl shadow-2xl hover:shadow-primary/20 transition-all duration-500">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
            
            <div className="relative p-8 md:p-12 space-y-8">
              <div className="flex items-start justify-between gap-8 flex-wrap">
                <div className="space-y-4 flex-1 min-w-[300px]">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-sm font-medium text-primary">Your Calendar</span>
                  </div>
                  
                  <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent leading-tight animate-fade-in">
                    Calendar
                  </h1>
                  
                  <p className="text-xl text-muted-foreground/90 max-w-2xl">
                    {todayCount > 0 
                      ? `${todayCount} event${todayCount > 1 ? 's' : ''} scheduled for today - Stay on track!` 
                      : 'Your schedule at a glance - Stay organized and productive'}
                  </p>
                  
                  <div className="flex items-center gap-6 text-sm flex-wrap pt-2">
                    <div className="flex items-center gap-2 group">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <CalendarDays className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{totalEvents}</p>
                        <p className="text-xs text-muted-foreground">Total Events</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 group">
                      <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                        <Clock className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{upcomingCount}</p>
                        <p className="text-xs text-muted-foreground">This Week</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 group">
                      <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{assignmentCount}</p>
                        <p className="text-xs text-muted-foreground">Assignments</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-50" />
          </div>

          {/* Premium Action Bar with Month Navigation */}
          <div className="flex items-center justify-between flex-wrap gap-4 p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Month Navigation */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMonthChange('prev')}
                  className="h-8 w-8 hover:bg-primary/10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="h-8 px-3 font-semibold hover:bg-primary/10 min-w-[140px]">
                      <CalendarClock className="h-4 w-4 mr-2" />
                      {format(selectedMonth, 'MMMM yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background/95 backdrop-blur-xl border-border/50 shadow-xl" align="start">
                    <CalendarPicker
                      mode="single"
                      selected={selectedMonth}
                      onSelect={handleDateSelect}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMonthChange('next')}
                  className="h-8 w-8 hover:bg-primary/10"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <div className="h-4 w-px bg-border/50 mx-1" />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedMonth(new Date());
                    jumpToToday();
                  }}
                  className="h-8 text-xs hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  Today
                </Button>
              </div>

              <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                <SelectTrigger className="w-[240px] bg-background/80 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all shadow-sm">
                  <SelectValue placeholder="All Calendars" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 shadow-xl">
                  <SelectItem value="all" className="cursor-pointer">
                    <span className="font-medium">All Calendars</span>
                    <Badge variant="secondary" className="ml-2">{totalEvents}</Badge>
                  </SelectItem>
                  {uniqueCalendars.map(calendar => {
                    const count = events.filter(e => 
                      ((e.metadata as any)?.calendar_name || 'Unknown Calendar') === calendar
                    ).length;
                    return (
                      <SelectItem key={calendar} value={calendar} className="cursor-pointer">
                        {calendar}
                        <Badge variant="outline" className="ml-2">{count}</Badge>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSync} 
              disabled={syncing} 
              className="gap-2 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 shadow-sm group"
            >
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                  <span>Sync Calendar</span>
                </>
              )}
            </Button>
          </div>

          {/* Main Content with Sidebar Layout */}
          <div className="flex gap-6 items-start">
            {/* Mini Calendar Sidebar */}
            <MiniCalendarSidebar
              selectedMonth={selectedMonth}
              events={events}
              onMonthChange={handleMonthChange}
              onDateSelect={handleDateSelect}
              selectedDate={selectedMonth}
            />

            {/* Main Content Area */}
            <div className="flex-1 space-y-8 min-w-0">
              {/* Premium Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card 
                  onClick={() => setSelectedFilter('all')}
                  className={cn(
                    "group cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl border-border/50 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm overflow-hidden relative",
                    selectedFilter === 'all' && "ring-2 ring-primary shadow-2xl shadow-primary/20 bg-gradient-to-br from-primary/10 to-background"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-6 space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <CalendarDays className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="outline" className="font-semibold">{totalEvents}</Badge>
                    </div>
                    <p className="text-3xl font-bold">{totalEvents}</p>
                    <p className="text-sm text-muted-foreground font-medium">All Events</p>
                  </CardContent>
                </Card>

                <Card 
                  onClick={() => setSelectedFilter('today')}
                  className={cn(
                    "group cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl border-border/50 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm overflow-hidden relative",
                    selectedFilter === 'today' && "ring-2 ring-blue-500 shadow-2xl shadow-blue-500/20 bg-gradient-to-br from-blue-500/10 to-background"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-6 space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                        <Zap className="h-6 w-6 text-blue-500" />
                      </div>
                      <Badge className="bg-blue-500 font-semibold">{todayCount}</Badge>
                    </div>
                    <p className="text-3xl font-bold">{todayCount}</p>
                    <p className="text-sm text-muted-foreground font-medium">Today</p>
                  </CardContent>
                </Card>

                <Card 
                  onClick={() => setSelectedFilter('upcoming')}
                  className={cn(
                    "group cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl border-border/50 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm overflow-hidden relative",
                    selectedFilter === 'upcoming' && "ring-2 ring-amber-500 shadow-2xl shadow-amber-500/20 bg-gradient-to-br from-amber-500/10 to-background"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-6 space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                        <TrendingUp className="h-6 w-6 text-amber-500" />
                      </div>
                      <Badge className="bg-amber-500 font-semibold">{upcomingCount}</Badge>
                    </div>
                    <p className="text-3xl font-bold">{upcomingCount}</p>
                    <p className="text-sm text-muted-foreground font-medium">Next 7 Days</p>
                  </CardContent>
                </Card>

                <Card 
                  onClick={() => setSelectedFilter('assignments')}
                  className={cn(
                    "group cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl border-border/50 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm overflow-hidden relative",
                    selectedFilter === 'assignments' && "ring-2 ring-green-500 shadow-2xl shadow-green-500/20 bg-gradient-to-br from-green-500/10 to-background"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-6 space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      </div>
                      <Badge className="bg-green-500 font-semibold">{assignmentCount}</Badge>
                    </div>
                    <p className="text-3xl font-bold">{assignmentCount}</p>
                    <p className="text-sm text-muted-foreground font-medium">Assignments</p>
                  </CardContent>
                </Card>
              </div>

              {/* Premium Events Timeline */}
              <div className="space-y-8">
            {sortedDates.map((date, idx) => {
              const dateObj = new Date(date);
              const isCurrentDay = isToday(dateObj);
              const dateLabel = isCurrentDay
                ? 'Today' 
                : isTomorrow(dateObj)
                ? 'Tomorrow'
                : format(dateObj, 'EEEE, MMMM d, yyyy');

              return (
                <div 
                  key={date}
                  id={`date-section-${date}`}
                  ref={isCurrentDay ? todaySectionRef : null}
                  className="space-y-5 animate-fade-in scroll-mt-24"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="sticky top-20 z-20 py-4 bg-gradient-to-b from-background via-background to-background/80 backdrop-blur-xl border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-1.5 rounded-full",
                        isCurrentDay 
                          ? "bg-gradient-to-b from-primary to-primary/50 animate-pulse" 
                          : "bg-gradient-to-b from-muted to-muted/50"
                      )} />
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className={cn(
                            "text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                            isCurrentDay 
                              ? "from-primary via-primary to-primary/70" 
                              : "from-foreground to-foreground/70"
                          )}>
                            {dateLabel}
                          </h2>
                          {isCurrentDay && (
                            <Badge className="bg-primary animate-pulse">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Now
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {groupedEvents[date].length} event{groupedEvents[date].length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {groupedEvents[date].map((event, eventIdx) => (
                      <div
                        key={event.id}
                        className="animate-scale-in"
                        style={{ animationDelay: `${(idx * 50) + (eventIdx * 30)}ms` }}
                      >
                        <CalendarEventCard event={event} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
              </div>
            </div>
          </div>

          {/* Floating Jump to Today Button */}
          {showJumpToToday && (
            <button
              onClick={jumpToToday}
              className="fixed bottom-8 right-8 z-50 p-4 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 hover:scale-110 hover:shadow-3xl hover:shadow-primary/40 transition-all duration-300 animate-fade-in group"
              aria-label="Jump to today"
            >
              <CalendarDays className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-2 -right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            </button>
          )}
        </div>
      </AnimatedTransition>
    </div>
  );
};

export default CalendarPage;
