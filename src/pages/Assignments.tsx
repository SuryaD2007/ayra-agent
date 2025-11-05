import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ExternalLink, Loader2, BookOpen, Clock, Target, Zap, CheckCircle2, Circle, Trophy, RefreshCw } from 'lucide-react';
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
    grade?: string;
    score?: number;
  };
}

const Assignments = () => {
  const showContent = useAnimateIn(false, 200);
  const [assignments, setAssignments] = useState<CanvasAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
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
          {/* Hero Dashboard Section */}
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-background p-8 shadow-lg">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
            <div className="relative space-y-6">
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div className="space-y-3 flex-1 min-w-[300px]">
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent">
                    Canvas Assignments
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    {getMotivationalMessage()}
                  </p>
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span>{totalAssignments} total</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span>{dueSoonCount} due soon</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>{submittedCount} completed</span>
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

            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium">Keep up the great work!</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="gap-2"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Sync from Canvas
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
                    {courseAssignments.map((assignment, assignIdx) => {
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
                            "border-border/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.01] hover-glide animate-fade-in relative overflow-hidden group",
                            getBorderClass()
                          )}
                          style={{ animationDelay: `${(idx * 100) + (assignIdx * 50)}ms` }}
                          onClick={(e) => {
                            // Prevent card click when clicking buttons inside
                            if ((e.target as HTMLElement).closest('button, a')) {
                              e.stopPropagation();
                            }
                          }}
                        >
                          {/* Hover gradient effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          
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
                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    asChild
                                    className="hover-glide smooth-bounce"
                                  >
                                    <a 
                                      href={assignment.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      View in Canvas
                                      <ExternalLink className="ml-2 h-4 w-4" />
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
                                      className="hover-glide smooth-bounce"
                                    >
                                      {submittingId === assignment.id ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Updating...
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="mr-2 h-4 w-4" />
                                          Mark as Submitted
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
              ))}
            </div>
          )}
        </div>
      </AnimatedTransition>
    </div>
  );
};

export default Assignments;