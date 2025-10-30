import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      throw new Error('Google Drive not connected');
    }

    // Check if token needs refresh
    const tokenExpiry = new Date(integration.token_expires_at);
    let accessToken = integration.access_token;

    if (tokenExpiry <= new Date()) {
      console.log('Token expired, refreshing...');
      const refreshResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/refresh-google-token`,
        {
          headers: { Authorization: req.headers.get('Authorization')! },
        }
      );
      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
    }

    // Fetch files from Google Drive
    let query = "trashed=false and mimeType != 'application/vnd.google-apps.folder'";
    
    const driveResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,webViewLink,modifiedTime,createdTime,parents,thumbnailLink),nextPageToken&pageSize=100`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!driveResponse.ok) {
      throw new Error('Failed to fetch Drive files');
    }

    const driveData = await driveResponse.json();
    const files = driveData.files || [];

    let synced = 0;
    let errors = 0;

    // Process each file
    for (const file of files) {
      try {
        // Check if file already exists
        const { data: existing } = await supabaseClient
          .from('google_drive_items')
          .select('id')
          .eq('user_id', user.id)
          .eq('drive_id', file.id)
          .maybeSingle();

        const fileData = {
          user_id: user.id,
          drive_id: file.id,
          name: file.name,
          mime_type: file.mimeType,
          file_size: file.size ? parseInt(file.size) : null,
          web_view_link: file.webViewLink,
          modified_time: file.modifiedTime,
          created_time: file.createdTime,
          parent_folder_id: file.parents?.[0] || null,
          thumbnail_link: file.thumbnailLink,
          metadata: { originalFile: file },
          synced_at: new Date().toISOString(),
        };

        if (existing) {
          await supabaseClient
            .from('google_drive_items')
            .update(fileData)
            .eq('id', existing.id);
        } else {
          await supabaseClient
            .from('google_drive_items')
            .insert(fileData);
        }

        synced++;
      } catch (error) {
        console.error(`Error syncing file ${file.id}:`, error);
        errors++;
      }
    }

    // Update last sync time
    await supabaseClient
      .from('google_integrations')
      .update({
        drive_last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    console.log(`Drive sync complete: ${synced} files synced, ${errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        synced,
        errors,
        total: files.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error syncing Google Drive:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
