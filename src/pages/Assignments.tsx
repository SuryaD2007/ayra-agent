import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ExternalLink, Loader2, BookOpen, Clock, Target, Zap, CheckCircle2, Circle, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

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
  };
}

const Assignments = () => {
  const showContent = useAnimateIn(false, 200);
  const [assignments, setAssignments] = useState<CanvasAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'due-soon' | 'submitted'>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('canvas_items')
        .select('*')
        .eq('type', 'assignment')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setAssignments((data || []) as CanvasAssignment[]);
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

  const getStatusBadge = (dueDate: string | null) => {
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

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground animate-pulse">Loading assignments...</p>
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 pt-24 px-4">
        <AnimatedTransition show={showContent} animation="fade">
          <div className="max-w-2xl mx-auto">
            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="py-16 text-center space-y-6">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse-slow" />
                  <BookOpen className="h-16 w-16 mx-auto text-primary relative animate-float" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">No assignments found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Connect your Canvas account and sync your data to see all your assignments in one place
                  </p>
                </div>
                <Button 
                  onClick={() => window.location.href = '/settings'}
                  className="mt-4 hover-glide smooth-bounce"
                  size="lg"
                >
                  Go to Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </AnimatedTransition>
      </div>
    );
  }

  // Group filtered assignments by course
  const assignmentsByCourse = filteredAssignments.reduce((acc, assignment) => {
    const course = assignment.course_name || 'Uncategorized';
    if (!acc[course]) acc[course] = [];
    acc[course].push(assignment);
    return acc;
  }, {} as Record<string, CanvasAssignment[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 pt-20">
      <AnimatedTransition show={showContent} animation="fade">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          {/* Header with Stats */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Canvas Assignments
                </h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  {totalAssignments} assignment{totalAssignments !== 1 ? 's' : ''} synced from Canvas
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-amber-500 animate-pulse-slow" />
                <div className="text-right">
                  <p className="text-2xl font-bold">{submittedCount}</p>
                  <p className="text-xs text-muted-foreground">Submitted</p>
                </div>
              </div>
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
                    <Target className="h-8 w-8 text-primary" />
                    <Badge variant="outline" className="text-xs">{totalAssignments}</Badge>
                  </div>
                  <p className="text-2xl font-bold">{totalAssignments}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </CardContent>
              </Card>

              <Card 
                onClick={() => setSelectedFilter('due-soon')}
                className={cn(
                  "cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-border/50",
                  selectedFilter === 'due-soon' && "ring-2 ring-amber-500 shadow-lg bg-amber-500/5"
                )}
              >
                <CardContent className="p-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <Clock className="h-8 w-8 text-amber-500" />
                    <Badge className="bg-amber-500 text-xs">{dueSoonCount}</Badge>
                  </div>
                  <p className="text-2xl font-bold">{dueSoonCount}</p>
                  <p className="text-sm text-muted-foreground">Due Soon</p>
                </CardContent>
              </Card>

              <Card 
                onClick={() => setSelectedFilter('upcoming')}
                className={cn(
                  "cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-border/50",
                  selectedFilter === 'upcoming' && "ring-2 ring-blue-500 shadow-lg bg-blue-500/5"
                )}
              >
                <CardContent className="p-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <Calendar className="h-8 w-8 text-blue-500" />
                    <Badge className="bg-blue-500 text-xs">{upcomingCount}</Badge>
                  </div>
                  <p className="text-2xl font-bold">{upcomingCount}</p>
                  <p className="text-sm text-muted-foreground">This Week</p>
                </CardContent>
              </Card>

              <Card 
                onClick={() => setSelectedFilter('submitted')}
                className={cn(
                  "cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-border/50",
                  selectedFilter === 'submitted' && "ring-2 ring-green-500 shadow-lg bg-green-500/5"
                )}
              >
                <CardContent className="p-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                    <Badge className="bg-green-500 text-xs">{submittedCount}</Badge>
                  </div>
                  <p className="text-2xl font-bold">{submittedCount}</p>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Assignments List */}
          {filteredAssignments.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No {selectedFilter !== 'all' && selectedFilter.replace('-', ' ')} assignments</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedFilter === 'submitted' && "No submitted assignments yet. Keep working!"}
                  {selectedFilter === 'due-soon' && "No assignments due in the next 3 days."}
                  {selectedFilter === 'upcoming' && "No assignments due this week."}
                </p>
                <Button variant="outline" onClick={() => setSelectedFilter('all')}>
                  View All Assignments
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(assignmentsByCourse).map(([courseName, courseAssignments], idx) => (
                <div key={courseName} className="space-y-4 animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-semibold">{courseName}</h2>
                    <Badge variant="outline" className="ml-2">
                      {courseAssignments.length}
                    </Badge>
                  </div>

                  <div className="grid gap-4">
                    {courseAssignments.map((assignment, assignIdx) => (
                      <Card 
                        key={assignment.id}
                        className="border-border/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.01] hover-glide animate-fade-in"
                        style={{ animationDelay: `${(idx * 100) + (assignIdx * 50)}ms` }}
                      >
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  {(assignment.submission_status === 'submitted' || assignment.submission_status === 'graded') ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <CardTitle className="text-xl mb-2 hover:text-primary transition-colors">
                                    {assignment.title}
                                  </CardTitle>
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                    {(assignment.submission_status === 'submitted' || assignment.submission_status === 'graded') && assignment.submitted_at && (
                                      <div className="flex items-center gap-1.5 text-green-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>Submitted: {format(new Date(assignment.submitted_at), 'PPP')}</span>
                                      </div>
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
                            {getStatusBadge(assignment.due_date)}
                          </div>
                        </CardHeader>
                        {(assignment.description || assignment.url) && (
                          <CardContent className="space-y-4">
                            {assignment.description && (
                              <CardDescription 
                                className="line-clamp-2 text-sm"
                                dangerouslySetInnerHTML={{ 
                                  __html: assignment.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...' 
                                }}
                              />
                            )}
                            {assignment.url && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                asChild
                                className="hover-glide smooth-bounce"
                              >
                                <a href={assignment.url} target="_blank" rel="noopener noreferrer">
                                  View in Canvas
                                  <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AnimatedTransition>
    </div>
  );
};

export default Assignments;
