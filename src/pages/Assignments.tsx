import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ExternalLink, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface CanvasAssignment {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  course_name: string;
  url: string;
  metadata: {
    points_possible?: number;
    submission_types?: string[];
  };
}

const Assignments = () => {
  const [assignments, setAssignments] = useState<CanvasAssignment[]>([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Canvas Assignments</h1>
          <p className="text-muted-foreground mb-8">View and track your Canvas assignments</p>
          
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
              <p className="text-muted-foreground mb-4">
                Make sure you've connected Canvas and synced your data in Settings
              </p>
              <Button onClick={() => window.location.href = '/settings'}>
                Go to Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Group assignments by course
  const assignmentsByCourse = assignments.reduce((acc, assignment) => {
    const course = assignment.course_name || 'Uncategorized';
    if (!acc[course]) acc[course] = [];
    acc[course].push(assignment);
    return acc;
  }, {} as Record<string, CanvasAssignment[]>);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Canvas Assignments</h1>
        <p className="text-muted-foreground mb-8">
          {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} synced from Canvas
        </p>

        <div className="space-y-6">
          {Object.entries(assignmentsByCourse).map(([courseName, courseAssignments]) => (
            <div key={courseName}>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                {courseName}
                <Badge variant="outline" className="ml-2">
                  {courseAssignments.length}
                </Badge>
              </h2>

              <div className="space-y-4">
                {courseAssignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{assignment.title}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {assignment.due_date && (
                              <>
                                <Calendar className="h-4 w-4" />
                                <span>Due: {format(new Date(assignment.due_date), 'PPP')}</span>
                              </>
                            )}
                            {assignment.metadata.points_possible && (
                              <Badge variant="outline" className="ml-2">
                                {assignment.metadata.points_possible} pts
                              </Badge>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(assignment.due_date)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {assignment.description && (
                        <CardDescription 
                          className="mb-4 line-clamp-3"
                          dangerouslySetInnerHTML={{ 
                            __html: assignment.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...' 
                          }}
                        />
                      )}
                      {assignment.url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={assignment.url} target="_blank" rel="noopener noreferrer">
                            View in Canvas
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Assignments;
