import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ExternalLink, Loader2, BookOpen, Clock, Target, Zap, CheckCircle2, Circle, Trophy, RefreshCw, Filter, CalendarDays, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, differenceInDays, startOfMonth, addMonths, subMonths, startOfDay, isToday, isTomorrow, isPast } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MiniAssignmentCalendar } from '@/components/assignments/MiniAssignmentCalendar';

interface CanvasAssignment {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  course_name: string;
  url: string;
  submission_status: 'not_submitted' | 'submitted' | 'graded';
  submitted_at: string | null;
  metadata: {
    points_possible?: number;
    submission_types?: string[];
    grade?: string;
    score?: number;
  };
  source?: 'canvas' | 'google_calendar';
}

const Assignments = () => {
  const showContent = useAnimateIn(false, 200);
  const [assignments, setAssignments] = useState<CanvasAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'due-soon' | 'submitted'>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [showJumpToToday, setShowJumpToToday] = useState(false);
  const todaySectionRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      // Fetch Canvas assignments
      const { data: canvasData, error: canvasError } = await supabase
        .from('canvas_items')
        .select('*')
        .eq('type', 'assignment')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (canvasError) throw canvasError;

      // Fetch Google Calendar assignments
      const { data: calendarData, error: calendarError } = await supabase
        .from('google_calendar_events')
        .select('*')
        .eq('is_assignment', true)
        .order('start_time', { ascending: true });

      if (calendarError) console.error('Calendar fetch error:', calendarError);

      // Transform calendar events to match assignment interface
      const calendarAssignments = (calendarData || []).map(event => {
        const eventMetadata = event.metadata as any;
        return {
          id: event.id,
          title: event.summary,
          description: event.description || '',
          due_date: event.start_time,
          course_name: eventMetadata?.calendar_name || 'Calendar',
          url: event.html_link,
          submission_status: 'not_submitted' as const,
          submitted_at: null,
          metadata: {},
          source: 'google_calendar' as const
        };
      });

      // Combine and sort all assignments
      const allAssignments = [
        ...(canvasData || []).map(a => ({ 
          ...a, 
          source: 'canvas' as const,
          submission_status: a.submission_status as 'not_submitted' | 'submitted' | 'graded',
          metadata: a.metadata as { 
            points_possible?: number; 
            submission_types?: string[]; 
            grade?: string; 
            score?: number; 
          }
        })),
        ...calendarAssignments
      ].sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });

      setAssignments(allAssignments);
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assignments',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsSubmitted = async (assignmentId: string) => {
    try {
      setSubmittingId(assignmentId);
      console.log('Marking assignment as submitted:', assignmentId);
      
      const { data, error } = await supabase
        .from('canvas_items')
        .update({ 
          submission_status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', assignmentId)
        .select();

      if (error) {
        console.error('Error updating assignment:', error);
        throw error;
      }

      console.log('Update successful:', data);

      setAssignments(prev => prev.map(a => 
        a.id === assignmentId 
          ? { ...a, submission_status: 'submitted', submitted_at: new Date().toISOString() }
          : a
      ));

      toast({
        title: '✅ Status updated',
        description: 'Assignment marked as submitted'
      });
    } catch (error: any) {
      console.error('Failed to mark as submitted:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive'
      });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const { data, error } = await supabase.functions.invoke('sync-canvas-data');

      if (error) throw error;

      toast({
        title: 'Sync complete',
        description: `Synced ${data?.synced || 0} assignments from Canvas`
      });

      await fetchAssignments();
    } catch (error: any) {
      toast({
        title: 'Sync failed',
        description: error.message || 'Failed to sync Canvas data',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (dueDate: string | null, submissionStatus: string) => {
    // If submitted or graded, show completion status instead
    if (submissionStatus === 'submitted' || submissionStatus === 'graded') {
      return <Badge className="bg-green-500">Submitted</Badge>;
    }

    if (!dueDate) {
      return <Badge variant="secondary">No Due Date</Badge>;
    }

    const due = new Date(dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (daysUntilDue <= 3) {
      return <Badge className="bg-amber-500">Due Soon</Badge>;
    } else if (daysUntilDue <= 7) {
      return <Badge className="bg-blue-500">This Week</Badge>;
    } else {
      return <Badge variant="secondary">Upcoming</Badge>;
    }
  };

  // Calculate stats
  const totalAssignments = assignments.length;
  const submittedCount = assignments.filter(a => a.submission_status === 'submitted' || a.submission_status === 'graded').length;
  const dueSoonCount = assignments.filter(a => {
    if (!a.due_date) return false;
    const days = differenceInDays(new Date(a.due_date), new Date());
    return days >= 0 && days <= 3;
  }).length;
  const upcomingCount = assignments.filter(a => {
    if (!a.due_date) return false;
    const days = differenceInDays(new Date(a.due_date), new Date());
    return days > 3 && days <= 7;
  }).length;

  // Calculate completion percentage
  const completionPercentage = totalAssignments > 0 
    ? Math.round((submittedCount / totalAssignments) * 100) 
    : 0;

  // Get motivational message based on progress
  const getMotivationalMessage = () => {
    if (completionPercentage === 100) return "🎉 Perfect! All assignments completed!";
    if (completionPercentage >= 80) return "⚡ Almost there! Keep it up!";
    if (completionPercentage >= 60) return "💪 Great progress! You're on fire!";
    if (completionPercentage >= 40) return "🚀 Nice work! Keep pushing forward!";
    if (completionPercentage >= 20) return "✨ Good start! Let's build momentum!";
    return "🎯 Ready to conquer your assignments?";
  };

  // Get unique courses for dropdown
  const uniqueCourses = Array.from(new Set(assignments.map(a => a.course_name || 'Uncategorized')))
    .sort();

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    // Course filter
    if (selectedCourse !== 'all') {
      const course = assignment.course_name || 'Uncategorized';
      if (course !== selectedCourse) return false;
    }

    // Status filter
    if (selectedFilter === 'all') return true;
    
    if (selectedFilter === 'submitted') {
      return assignment.submission_status === 'submitted' || assignment.submission_status === 'graded';
    }
    
    if (!assignment.due_date) return false;
    const days = differenceInDays(new Date(assignment.due_date), new Date());
    
    if (selectedFilter === 'due-soon') return days >= 0 && days <= 3;
    if (selectedFilter === 'upcoming') return days > 3 && days <= 7;
    return true;
  });

  // Auto-scroll to today's assignments on load
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

  const handleDateSelect = (date: Date) => {
    setSelectedMonth(date);
    // Scroll to assignments for this date (at the top, not center)
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    const section = document.getElementById(`date-section-${dateStr}`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
            <p className="text-lg font-medium">Loading assignments</p>
            <p className="text-sm text-muted-foreground animate-pulse">Gathering your tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background pt-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
        <AnimatedTransition show={showContent} animation="fade">
          <div className="max-w-2xl mx-auto relative z-10">
            <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-background/95 hover:shadow-primary/20 transition-all duration-500">
              <CardContent className="py-20 text-center space-y-8">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                  <BookOpen className="h-20 w-20 mx-auto text-primary relative animate-float" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent">
                    No assignments found
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto text-lg">
                    Connect your Canvas account and sync your data to see all your assignments in one place
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
                    disabled={isSyncing} 
                    size="lg"
                    className="hover:border-primary/50 transition-all duration-300"
                  >
                    {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
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

  // Group filtered assignments by date first
  const assignmentsByDate = filteredAssignments.reduce((acc, assignment) => {
    const date = assignment.due_date 
      ? format(startOfDay(new Date(assignment.due_date)), 'yyyy-MM-dd')
      : 'no-date';
    if (!acc[date]) acc[date] = [];
    acc[date].push(assignment);
    return acc;
  }, {} as Record<string, CanvasAssignment[]>);

  // Sort dates - today first, then future dates, then past dates
  const sortedDates = Object.keys(assignmentsByDate).sort((a, b) => {
    if (a === 'no-date') return 1;
    if (b === 'no-date') return -1;
    
    const dateA = new Date(a);
    const dateB = new Date(b);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const isAToday = isToday(dateA);
    const isBToday = isToday(dateB);
    
    // Today always first
    if (isAToday && !isBToday) return -1;
    if (!isAToday && isBToday) return 1;
    
    // Then sort by date ascending
    return dateA.getTime() - dateB.getTime();
  });

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
                    <span className="text-sm font-medium text-primary">Your Tasks</span>
                  </div>
                  
                  <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent leading-tight animate-fade-in">
                    Assignments
                  </h1>
                  
                  <p className="text-xl text-muted-foreground/90 max-w-2xl">
                    {getMotivationalMessage()}
                  </p>
                  
                  <div className="flex items-center gap-6 text-sm flex-wrap pt-2">
                    <div className="flex items-center gap-2 group">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Target className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{totalAssignments}</p>
                        <p className="text-xs text-muted-foreground">Total Tasks</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 group">
                      <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                        <Clock className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{dueSoonCount}</p>
                        <p className="text-xs text-muted-foreground">Due Soon</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 group">
                      <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{submittedCount}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Circular Progress Tracker */}
                <div className="relative">
                  <div className="relative flex items-center justify-center w-32 h-32">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-muted/20"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - completionPercentage / 100)}`}
                        className="text-primary transition-all duration-1000 ease-out"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold">{completionPercentage}%</span>
                      <span className="text-xs text-muted-foreground">Complete</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-medium">{submittedCount} of {totalAssignments}</span>
                </div>
                <Progress value={completionPercentage} className="h-3" />
              </div>
            </div>

            
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-50" />
          </div>

          {/* Premium Action Bar */}
          <div className="flex items-center justify-between flex-wrap gap-4 p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-[240px] bg-background/80 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all shadow-sm">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 shadow-xl">
                  <SelectItem value="all" className="cursor-pointer">
                    <span className="font-medium">All Courses</span>
                    <Badge variant="secondary" className="ml-2">{totalAssignments}</Badge>
                  </SelectItem>
                  {uniqueCourses.map(course => {
                    const courseCount = assignments.filter(a => 
                      (a.course_name || 'Uncategorized') === course
                    ).length;
                    return (
                      <SelectItem 
                        key={course} 
                        value={course}
                        className="cursor-pointer"
                      >
                        {course}
                        <Badge variant="outline" className="ml-2">{courseCount}</Badge>
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
              disabled={isSyncing} 
              className="gap-2 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 shadow-sm group"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                  <span>Sync from Canvas</span>
                </>
              )}
            </Button>
          </div>

          {/* Main Content with Sidebar Layout */}
          <div className="flex gap-6 items-start">
            {/* Mini Assignment Calendar */}
            <MiniAssignmentCalendar
              selectedMonth={selectedMonth}
              assignments={assignments}
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
                        <Target className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="outline" className="font-semibold">{totalAssignments}</Badge>
                    </div>
                    <p className="text-3xl font-bold">{totalAssignments}</p>
                    <p className="text-sm text-muted-foreground font-medium">Total Tasks</p>
                  </CardContent>
                </Card>

                <Card 
                  onClick={() => setSelectedFilter('due-soon')}
                  className={cn(
                    "group cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl border-border/50 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm overflow-hidden relative",
                    selectedFilter === 'due-soon' && "ring-2 ring-amber-500 shadow-2xl shadow-amber-500/20 bg-gradient-to-br from-amber-500/10 to-background"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-6 space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                        <Clock className="h-6 w-6 text-amber-500" />
                      </div>
                      <Badge className="bg-amber-500 font-semibold">{dueSoonCount}</Badge>
                    </div>
                    <p className="text-3xl font-bold">{dueSoonCount}</p>
                    <p className="text-sm text-muted-foreground font-medium">Due Soon</p>
                  </CardContent>
                </Card>

                <Card 
                  onClick={() => setSelectedFilter('upcoming')}
                  className={cn(
                    "group cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl border-border/50 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm overflow-hidden relative",
                    selectedFilter === 'upcoming' && "ring-2 ring-blue-500 shadow-2xl shadow-blue-500/20 bg-gradient-to-br from-blue-500/10 to-background"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-6 space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                        <TrendingUp className="h-6 w-6 text-blue-500" />
                      </div>
                      <Badge className="bg-blue-500 font-semibold">{upcomingCount}</Badge>
                    </div>
                    <p className="text-3xl font-bold">{upcomingCount}</p>
                    <p className="text-sm text-muted-foreground font-medium">This Week</p>
                  </CardContent>
                </Card>

                <Card 
                  onClick={() => setSelectedFilter('submitted')}
                  className={cn(
                    "group cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl border-border/50 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm overflow-hidden relative",
                    selectedFilter === 'submitted' && "ring-2 ring-green-500 shadow-2xl shadow-green-500/20 bg-gradient-to-br from-green-500/10 to-background"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-6 space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      </div>
                      <Badge className="bg-green-500 font-semibold">{submittedCount}</Badge>
                    </div>
                    <p className="text-3xl font-bold">{submittedCount}</p>
                    <p className="text-sm text-muted-foreground font-medium">Submitted</p>
                  </CardContent>
                </Card>
              </div>

              {/* Assignments List */}
              {filteredAssignments.length === 0 ? (
                <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
                  <CardContent className="py-16 text-center space-y-4">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                      <CheckCircle2 className="h-16 w-16 mx-auto text-primary/50 relative" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">No {selectedFilter !== 'all' && selectedFilter.replace('-', ' ')} assignments</h3>
                      <p className="text-muted-foreground">
                        {selectedFilter === 'submitted' && "No submitted assignments yet. Keep working!"}
                        {selectedFilter === 'due-soon' && "No assignments due in the next 3 days."}
                        {selectedFilter === 'upcoming' && "No assignments due this week."}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedFilter('all')} className="mt-4">
                      View All Assignments
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-8">
                  {sortedDates.map((date, dateIdx) => {
                    const dateAssignments = assignmentsByDate[date];
                    const dateObj = date !== 'no-date' ? new Date(date) : null;
                    const isTodaySection = dateObj && isToday(dateObj);
                    const isTomorrowSection = dateObj && isTomorrow(dateObj);
                    const isPastDate = dateObj && isPast(dateObj) && !isToday(dateObj);
                    
                    let dateLabel = date === 'no-date' 
                      ? 'No Due Date' 
                      : isTodaySection
                      ? `Today - ${format(dateObj, 'MMMM d, yyyy')}`
                      : isTomorrowSection
                      ? `Tomorrow - ${format(dateObj, 'MMMM d, yyyy')}`
                      : format(dateObj, 'EEEE, MMMM d, yyyy');

                    return (
                      <div 
                        key={date}
                        id={`date-section-${date}`}
                        ref={isTodaySection ? todaySectionRef : null}
                        className="space-y-5 animate-fade-in scroll-mt-24"
                        style={{ animationDelay: `${dateIdx * 50}ms` }}
                      >
                        {/* Sticky Date Header */}
                        <div className="sticky top-20 z-20 py-4 bg-gradient-to-b from-background via-background to-background/80 backdrop-blur-xl border-b border-border/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "h-10 w-1.5 rounded-full",
                                isTodaySection 
                                  ? "bg-gradient-to-b from-primary to-primary/50 animate-pulse" 
                                  : isPastDate
                                  ? "bg-gradient-to-b from-muted to-muted/50"
                                  : "bg-gradient-to-b from-blue-500 to-blue-500/50"
                              )} />
                              <div>
                                <div className="flex items-center gap-3">
                                  <h2 className={cn(
                                    "text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                                    isTodaySection 
                                      ? "from-primary via-primary to-primary/70" 
                                      : "from-foreground to-foreground/70"
                                  )}>
                                    {dateLabel}
                                  </h2>
                                  {isTodaySection && (
                                    <Badge className="bg-primary animate-pulse shadow-lg shadow-primary/20">
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      Now
                                    </Badge>
                                  )}
                                  {isPastDate && (
                                    <Badge variant="secondary">
                                      Overdue
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {dateAssignments.length} assignment{dateAssignments.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Assignments for this date */}
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {dateAssignments.map((assignment, assignIdx) => {
                      // Determine border gradient based on urgency
                      const getBorderClass = () => {
                        if (!assignment.due_date) return "";
                        const days = differenceInDays(new Date(assignment.due_date), new Date());
                        if (days < 0) return "border-l-4 border-l-destructive";
                        if (days <= 3) return "border-l-4 border-l-amber-500";
                        if (days <= 7) return "border-l-4 border-l-blue-500";
                        return "border-l-4 border-l-primary/30";
                      };

                        return (
                          <Card 
                            key={assignment.id}
                            className={cn(
                              "border-border/50 hover:shadow-xl transition-all duration-500 hover:scale-[1.02] animate-scale-in relative overflow-hidden group cursor-pointer bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm",
                              getBorderClass()
                            )}
                            style={{ animationDelay: `${(dateIdx * 50) + (assignIdx * 30)}ms` }}
                          onClick={(e) => {
                            // Prevent card click when clicking buttons inside
                            if ((e.target as HTMLElement).closest('button, a')) {
                              e.stopPropagation();
                            }
                          }}
                        >
                            {/* Hover gradient effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                          
                          <CardHeader className="relative">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start gap-3">
                                  <div className="mt-1 relative">
                                    {(assignment.submission_status === 'submitted' || assignment.submission_status === 'graded') ? (
                                      <div className="relative">
                                        <div className="absolute inset-0 bg-green-500/20 blur-md rounded-full animate-pulse" />
                                        <CheckCircle2 className="h-5 w-5 text-green-500 relative" />
                                      </div>
                                    ) : (
                                      <Circle className="h-5 w-5 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                     <div className="flex items-start gap-2 mb-2">
                                      <CardTitle className="text-xl hover:text-primary transition-colors flex-1">
                                        {assignment.title}
                                      </CardTitle>
                                      {assignment.source === 'google_calendar' && (
                                        <Badge variant="outline" className="gap-1 text-xs">
                                          <CalendarDays className="h-3 w-3" />
                                          Google Calendar
                                        </Badge>
                                      )}
                                      {assignment.source === 'canvas' && (
                                        <Badge variant="outline" className="gap-1 text-xs bg-primary/5">
                                          <BookOpen className="h-3 w-3" />
                                          Canvas
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                      {(assignment.submission_status === 'submitted' || assignment.submission_status === 'graded') && assignment.submitted_at && (
                                        <div className="flex items-center gap-1.5 text-green-600">
                                          <CheckCircle2 className="h-4 w-4" />
                                          <span>Submitted: {format(new Date(assignment.submitted_at), 'PPP')}</span>
                                        </div>
                                      )}
                                      {assignment.submission_status === 'graded' && assignment.metadata.grade && (
                                        <Badge className="bg-green-600 text-xs gap-1">
                                          <Trophy className="h-3 w-3" />
                                          Grade: {assignment.metadata.grade}
                                          {assignment.metadata.score && assignment.metadata.points_possible && (
                                            <span> ({assignment.metadata.score}/{assignment.metadata.points_possible})</span>
                                          )}
                                        </Badge>
                                      )}
                                      {assignment.due_date && (
                                        <div className="flex items-center gap-1.5">
                                          <Calendar className="h-4 w-4" />
                                          <span>Due: {format(new Date(assignment.due_date), 'PPP')}</span>
                                        </div>
                                      )}
                                      {assignment.metadata.points_possible && (
                                        <Badge variant="outline" className="gap-1">
                                          <Target className="h-3 w-3" />
                                          {assignment.metadata.points_possible} pts
                                        </Badge>
                                      )}
                                      {assignment.metadata.submission_types && assignment.metadata.submission_types.length > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          {assignment.metadata.submission_types[0]}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0">
                                {getStatusBadge(assignment.due_date, assignment.submission_status)}
                              </div>
                            </div>
                          </CardHeader>
                          {(assignment.description || assignment.url) && (
                            <CardContent className="space-y-4 pb-6">
                              {assignment.description && (
                                <CardDescription 
                                  className="line-clamp-2 text-sm"
                                  dangerouslySetInnerHTML={{ 
                                    __html: assignment.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...' 
                                  }}
                                />
                              )}
                              {assignment.url && (
                                <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    asChild
                                    className="hover-glide smooth-bounce flex-shrink-0"
                                  >
                                    <a 
                                      href={assignment.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center"
                                    >
                                      <span className="truncate max-w-[180px]">
                                        {assignment.source === 'google_calendar' ? 'View in Google Calendar' : 'View in Canvas'}
                                      </span>
                                      <ExternalLink className="ml-2 h-4 w-4 flex-shrink-0" />
                                    </a>
                                  </Button>
                                  {assignment.submission_status === 'not_submitted' && (
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('Button clicked!', assignment.id);
                                        markAsSubmitted(assignment.id);
                                      }}
                                      disabled={submittingId === assignment.id}
                                      className="hover-glide smooth-bounce flex-shrink-0 whitespace-nowrap"
                                    >
                                      {submittingId === assignment.id ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />
                                          <span>Updating...</span>
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="mr-2 h-4 w-4 flex-shrink-0" />
                                          <span>Mark as Submitted</span>
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          )}
                          </Card>
                          );
                        })}
                      </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

export default Assignments;