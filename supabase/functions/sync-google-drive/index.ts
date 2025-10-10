import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Get integration settings
    const { data: settings } = await supabaseClient
      .from('integration_settings')
      .select('*')
      .eq('user_id', user.id)
      .eq('integration_type', 'google_drive')
      .single();

    if (!settings || !settings.is_connected) {
      throw new Error('Google Drive not connected');
    }

    // Log sync start
    const { data: syncLog } = await supabaseClient
      .from('integration_sync_logs')
      .insert({
        user_id: user.id,
        integration_type: 'google_drive',
        status: 'in_progress',
      })
      .select()
      .single();

    let itemsSynced = 0;

    try {
      // Get files from Google Drive
      const filesResponse = await fetch(
        'https://www.googleapis.com/drive/v3/files?q=trashed=false&fields=files(id,name,mimeType,createdTime,modifiedTime,webViewLink)',
        {
          headers: {
            'Authorization': `Bearer ${settings.access_token}`,
          },
        }
      );

      const filesData = await filesResponse.json();

      // Import each file as an item
      for (const file of filesData.files || []) {
        const { error } = await supabaseClient
          .from('items')
          .upsert({
            user_id: user.id,
            title: file.name,
            type: 'file',
            source: `google_drive:${file.id}`,
            content: file.webViewLink,
            mime_type: file.mimeType,
            created_at: file.createdTime,
            updated_at: file.modifiedTime,
          }, {
            onConflict: 'user_id,source',
          });

        if (!error) itemsSynced++;
      }

      // Update sync log
      await supabaseClient
        .from('integration_sync_logs')
        .update({
          status: 'success',
          items_synced: itemsSynced,
        })
        .eq('id', syncLog!.id);

      // Update last sync time
      await supabaseClient
        .from('integration_settings')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', settings.id);

      return new Response(
        JSON.stringify({ success: true, itemsSynced }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (syncError) {
      // Update sync log with error
      await supabaseClient
        .from('integration_sync_logs')
        .update({
          status: 'error',
          error_message: syncError.message,
        })
        .eq('id', syncLog!.id);

      throw syncError;
    }
  } catch (error) {
    console.error('Google Drive sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
