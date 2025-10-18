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
      .from('integration_settings')
      .select('access_token')
      .eq('integration_type', 'google_drive')
      .eq('is_connected', true)
      .single();

    if (integrationError || !integration) {
      return new Response(JSON.stringify({ error: 'Google Drive not connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const driveResponse = await fetch(
      'https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application%2Fvnd.google-apps.document%27%20or%20mimeType%3D%27application%2Fvnd.google-apps.spreadsheet%27%20or%20mimeType%3D%27application%2Fvnd.google-apps.presentation%27%20or%20mimeType%3D%27application%2Fpdf%27&fields=files(id,name,mimeType,modifiedTime,webViewLink)',
      {
        headers: { Authorization: `Bearer ${integration.access_token}` }
      }
    );

    if (!driveResponse.ok) {
      throw new Error('Failed to fetch files from Google Drive');
    }

    const driveData = await driveResponse.json();
    let syncedCount = 0;

    for (const file of driveData.files || []) {
      const { error: itemError } = await supabaseClient
        .from('items')
        .upsert({
          user_id: user.id,
          type: 'file',
          title: file.name,
          source: file.webViewLink,
          mime_type: file.mimeType,
          content: `Google Drive file: ${file.name}`,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,source', ignoreDuplicates: false });

      if (!itemError) syncedCount++;
    }

    await supabaseClient
      .from('integration_settings')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('integration_type', 'google_drive')
      .eq('user_id', user.id);

    await supabaseClient
      .from('integration_sync_logs')
      .insert({
        user_id: user.id,
        integration_type: 'google_drive',
        status: 'success',
        items_synced: syncedCount
      });

    return new Response(
      JSON.stringify({ success: true, synced: syncedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});