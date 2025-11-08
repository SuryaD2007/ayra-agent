import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, CheckCircle2, CalendarDays } from 'lucide-react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { addDays } from 'date-fns';

export const CalendarStatsWidget = () => {
  const { events, getTodayEvents, loading } = useCalendarEvents();

  if (loading || events.length === 0) return null;

  const todayCount = getTodayEvents().length;
  const assignmentCount = events.filter(e => e.is_assignment).length;
  const upcomingCount = events.filter(e => {
    const eventDate = new Date(e.start_time);
    const nextWeek = addDays(new Date(), 7);
    return eventDate > new Date() && eventDate <= nextWeek;
  }).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-border/50 hover:shadow-md transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-500" />
            Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{todayCount}</p>
          <p className="text-xs text-muted-foreground">events today</p>
        </CardContent>
      </Card>

      <Card className="border-border/50 hover:shadow-md transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Upcoming
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{upcomingCount}</p>
          <p className="text-xs text-muted-foreground">next 7 days</p>
        </CardContent>
      </Card>

      <Card className="border-border/50 hover:shadow-md transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{assignmentCount}</p>
          <p className="text-xs text-muted-foreground">detected</p>
        </CardContent>
      </Card>
    </div>
  );
};
