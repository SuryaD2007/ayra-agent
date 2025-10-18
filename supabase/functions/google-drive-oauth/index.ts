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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // user_id
    const error = url.searchParams.get('error');

    if (error || !code || !state) {
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${Deno.env.get('SUPABASE_URL').replace('.supabase.co', '.lovable.app')}/settings?error=oauth_failed` }
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-drive-oauth`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    const { error: dbError } = await supabaseAdmin
      .from('integration_settings')
      .upsert({
        user_id: state,
        integration_type: 'google_drive',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        is_connected: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,integration_type' });

    if (dbError) throw dbError;

    return new Response(null, {
      status: 302,
      headers: { 'Location': `${Deno.env.get('SUPABASE_URL').replace('.supabase.co', '.lovable.app')}/settings?success=google_drive_connected` }
    });
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return new Response(null, {
      status: 302,
      headers: { 'Location': `${Deno.env.get('SUPABASE_URL').replace('.supabase.co', '.lovable.app')}/settings?error=oauth_failed` }
    });
  }
});