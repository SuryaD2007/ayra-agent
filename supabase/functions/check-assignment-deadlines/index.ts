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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all assignments due in the next 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const now = new Date();

    const { data: dueAssignments, error } = await supabaseClient
      .from('canvas_items')
      .select('*, canvas_integrations!inner(user_id)')
      .eq('type', 'assignment')
      .eq('submission_status', 'not_submitted')
      .gte('due_date', now.toISOString())
      .lte('due_date', tomorrow.toISOString());

    if (error) throw error;

    let notificationsSent = 0;

    // Group by user
    const assignmentsByUser = (dueAssignments || []).reduce((acc, assignment) => {
      const userId = assignment.user_id;
      if (!acc[userId]) acc[userId] = [];
      acc[userId].push(assignment);
      return acc;
    }, {} as Record<string, any[]>);

    // Send notifications for each user
    for (const [userId, assignments] of Object.entries(assignmentsByUser)) {
      try {
        // Get user profile for email
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('email, name')
          .eq('user_id', userId)
          .single();

        if (!profile?.email) continue;

        // Create notification
        const assignmentList = assignments
          .map(a => `• ${a.title} (${a.course_name}) - Due: ${new Date(a.due_date).toLocaleDateString()}`)
          .join('\n');

        await supabaseClient.functions.invoke('send-notification', {
          body: {
            userId,
            email: profile.email,
            subject: `⏰ ${assignments.length} assignment${assignments.length > 1 ? 's' : ''} due soon`,
            message: `Hi ${profile.name || 'there'},\n\nYou have ${assignments.length} assignment${assignments.length > 1 ? 's' : ''} due in the next 24 hours:\n\n${assignmentList}\n\nDon't forget to submit them in Canvas!\n\nBest,\nAyra Team`
          }
        });

        notificationsSent++;
      } catch (err) {
        console.error(`Error sending notification to user ${userId}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        checked: dueAssignments?.length || 0,
        notificationsSent 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Deadline check error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
