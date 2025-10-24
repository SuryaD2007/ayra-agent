import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: integration, error: integrationError } = await supabaseClient
      .from('canvas_integrations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (integrationError || !integration) {
      return new Response(JSON.stringify({ error: 'Canvas not connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Normalize URL: remove protocol and extra slashes
    const cleanUrl = integration.institution_url
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '');
    
    const baseUrl = `https://${cleanUrl}/api/v1`;
    const headers = { Authorization: `Bearer ${integration.access_token}` };

    console.log('Fetching from Canvas URL:', baseUrl);

    const coursesResponse = await fetch(`${baseUrl}/courses?enrollment_state=active`, { headers });
    if (!coursesResponse.ok) throw new Error('Failed to fetch courses');
    const courses = await coursesResponse.json();

    let syncedCount = 0;

    for (const course of courses) {
      const assignmentsResponse = await fetch(
        `${baseUrl}/courses/${course.id}/assignments`,
        { headers }
      );
      
      if (!assignmentsResponse.ok) continue;
      const assignments = await assignmentsResponse.json();

      for (const assignment of assignments) {
        // Fetch submission data to check if assignment is submitted
        let submissionStatus = 'not_submitted';
        let submittedAt = null;
        
        try {
          const submissionResponse = await fetch(
            `${baseUrl}/courses/${course.id}/assignments/${assignment.id}/submissions/self`,
            { headers }
          );
          
          if (submissionResponse.ok) {
            const submission = await submissionResponse.json();
            if (submission.submitted_at) {
              submittedAt = submission.submitted_at;
              submissionStatus = submission.grade ? 'graded' : 'submitted';
              
              // Add grade info to metadata if available
              if (submission.grade) {
                assignment.grade = submission.grade;
                assignment.score = submission.score;
              }
            }
          }
        } catch (e) {
          console.log('Could not fetch submission for assignment:', assignment.id);
        }

        const { error: itemError } = await supabaseClient
          .from('canvas_items')
          .upsert({
            user_id: user.id,
            canvas_id: assignment.id.toString(),
            type: 'assignment',
            course_name: course.name,
            title: assignment.name,
            description: assignment.description,
            due_date: assignment.due_at,
            url: assignment.html_url,
            submission_status: submissionStatus,
            submitted_at: submittedAt,
            metadata: {
              points_possible: assignment.points_possible,
              submission_types: assignment.submission_types,
              grade: assignment.grade,
              score: assignment.score
            },
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,canvas_id' });

        if (!itemError) syncedCount++;
      }
    }

    await supabaseClient
      .from('canvas_integrations')
      .update({ updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    // Fetch updated stats
    const { data: items } = await supabaseClient
      .from('canvas_items')
      .select('type, course_name, submission_status');
    
    const courses = new Set(items?.map(item => item.course_name) || []).size;
    const assignments = items?.filter(item => item.type === 'assignment').length || 0;
    const submitted = items?.filter(item => 
      item.submission_status === 'submitted' || item.submission_status === 'graded'
    ).length || 0;

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: syncedCount,
        stats: { courses, assignments, submitted }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Canvas sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});