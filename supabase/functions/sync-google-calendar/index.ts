import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Keywords that indicate an assignment
const ASSIGNMENT_KEYWORDS = [
  'assignment', 'due', 'homework', 'project', 'exam', 'test',
  'quiz', 'presentation', 'submit', 'deadline', 'paper'
];

function detectAssignment(event: any): boolean {
  const searchText = `${event.summary || ''} ${event.description || ''}`.toLowerCase();
  return ASSIGNMENT_KEYWORDS.some(keyword => searchText.includes(keyword));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    // Get user's Google integration
    const { data: integration, error: integrationError } = await supabaseClient
      .from('google_integrations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (integrationError || !integration) {
      throw new Error('Google Calendar not connected');
    }

    // Decrypt the access token
    const { decryptToken } = await import('../_shared/encryption.ts');
    let accessToken: string;
    
    try {
      accessToken = await decryptToken(integration.access_token);
    } catch (error) {
      console.error('Failed to decrypt access token:', error);
      throw new Error('Invalid access token. Please reconnect your Google account.');
    }

    // Check if token needs refresh
    const tokenExpiry = new Date(integration.token_expires_at);

    if (tokenExpiry <= new Date()) {
      console.log('Token expired, refreshing...');
      const refreshResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/refresh-google-token`,
        {
          headers: { Authorization: req.headers.get('Authorization')! },
        }
      );
      
      if (!refreshResponse.ok) {
        console.error('Token refresh failed:', await refreshResponse.text());
        throw new Error('Failed to refresh access token. Please reconnect your Google account.');
      }
      
      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
    }

    // Get calendar list
    const calendarListResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!calendarListResponse.ok) {
      const errorBody = await calendarListResponse.text();
      console.error('Google Calendar API error:', calendarListResponse.status, errorBody);
      
      // Handle authentication errors
      if (calendarListResponse.status === 401 || calendarListResponse.status === 403) {
        throw new Error('Google Calendar authentication failed. Please disconnect and reconnect your account.');
      }
      
      throw new Error(`Google Calendar API error: ${calendarListResponse.status} - ${errorBody}`);
    }

    const calendarListData = await calendarListResponse.json();
    const calendars = calendarListData.items || [];

    let synced = 0;
    let errors = 0;
    let assignmentsDetected = 0;

    // Fetch events from each calendar
    for (const calendar of calendars) {
      try {
        const now = new Date();
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const sixMonthsAhead = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

        const eventsResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?timeMin=${threeMonthsAgo.toISOString()}&timeMax=${sixMonthsAhead.toISOString()}&singleEvents=true&orderBy=startTime`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!eventsResponse.ok) {
          console.error(`Failed to fetch events for calendar ${calendar.id}`);
          continue;
        }

        const eventsData = await eventsResponse.json();
        const events = eventsData.items || [];

        // Process each event
        for (const event of events) {
          try {
            const startTime = event.start?.dateTime || event.start?.date;
            const endTime = event.end?.dateTime || event.end?.date;
            const isAllDay = !event.start?.dateTime;
            const isAssignment = detectAssignment(event);

            if (!startTime || !endTime) continue;

            // Check if event already exists
            const { data: existing } = await supabaseClient
              .from('google_calendar_events')
              .select('id')
              .eq('user_id', user.id)
              .eq('event_id', event.id)
              .maybeSingle();

            const eventData = {
              user_id: user.id,
              event_id: event.id,
              calendar_id: calendar.id,
              summary: event.summary || 'Untitled Event',
              description: event.description || null,
              start_time: new Date(startTime).toISOString(),
              end_time: new Date(endTime).toISOString(),
              is_all_day: isAllDay,
              location: event.location || null,
              html_link: event.htmlLink,
              is_recurring: !!event.recurrence,
              recurrence_rule: event.recurrence?.[0] || null,
              status: event.status || 'confirmed',
              is_assignment: isAssignment,
              metadata: { originalEvent: event, calendarName: calendar.summary },
              synced_at: new Date().toISOString(),
            };

            if (existing) {
              await supabaseClient
                .from('google_calendar_events')
                .update(eventData)
                .eq('id', existing.id);
            } else {
              await supabaseClient
                .from('google_calendar_events')
                .insert(eventData);
            }

            if (isAssignment) assignmentsDetected++;
            synced++;
          } catch (error) {
            console.error(`Error syncing event ${event.id}:`, error);
            errors++;
          }
        }
      } catch (error) {
        console.error(`Error processing calendar ${calendar.id}:`, error);
        errors++;
      }
    }

    // Update last sync time
    await supabaseClient
      .from('google_integrations')
      .update({
        calendar_last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    console.log(`Calendar sync complete: ${synced} events synced, ${assignmentsDetected} assignments detected, ${errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        synced,
        errors,
        assignments_detected: assignmentsDetected,
        calendars_processed: calendars.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error syncing Google Calendar:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
