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

    // Fetch files from Google Drive
    let query = "trashed=false and mimeType != 'application/vnd.google-apps.folder'";
    
    const driveResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,webViewLink,modifiedTime,createdTime,parents,thumbnailLink),nextPageToken&pageSize=100`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!driveResponse.ok) {
      const errorBody = await driveResponse.text();
      console.error('Google Drive API error:', driveResponse.status, errorBody);
      
      // Handle authentication errors
      if (driveResponse.status === 401 || driveResponse.status === 403) {
        // Try to refresh token one more time
        console.log('Authentication error, attempting token refresh...');
        const refreshResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/refresh-google-token`,
          {
            headers: { Authorization: req.headers.get('Authorization')! },
          }
        );
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          accessToken = refreshData.access_token;
          
          // Retry the Drive request
          const retryResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,webViewLink,modifiedTime,createdTime,parents,thumbnailLink),nextPageToken&pageSize=100`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          
          if (!retryResponse.ok) {
            throw new Error('Google Drive authentication failed. Please disconnect and reconnect your account.');
          }
          
          const retryData = await retryResponse.json();
          const files = retryData.files || [];
          
          // Continue with retry data
          let synced = 0;
          let errors = 0;

          for (const file of files) {
            try {
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

          await supabaseClient
            .from('google_integrations')
            .update({
              drive_last_sync: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

          return new Response(
            JSON.stringify({
              success: true,
              synced,
              errors,
              total: files.length,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          throw new Error('Google Drive authentication failed. Please disconnect and reconnect your account.');
        }
      }
      
      throw new Error(`Google Drive API error: ${driveResponse.status} - ${errorBody}`);
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
