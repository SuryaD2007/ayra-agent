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
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error || !code || !state) {
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${Deno.env.get('SUPABASE_URL').replace('.supabase.co', '.lovable.app')}/settings?error=canvas_oauth_failed` }
      });
    }

    const [userId, institutionUrl] = state.split('|');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const clientId = Deno.env.get('CANVAS_CLIENT_ID');
    const clientSecret = Deno.env.get('CANVAS_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/canvas-oauth`;

    const tokenResponse = await fetch(`https://${institutionUrl}/login/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        code
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    const { error: dbError } = await supabaseAdmin
      .from('canvas_integrations')
      .upsert({
        user_id: userId,
        institution_url: institutionUrl,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (dbError) throw dbError;

    return new Response(null, {
      status: 302,
      headers: { 'Location': `${Deno.env.get('SUPABASE_URL').replace('.supabase.co', '.lovable.app')}/settings?success=canvas_connected` }
    });
  } catch (error: any) {
    console.error('Canvas OAuth callback error:', error);
    return new Response(null, {
      status: 302,
      headers: { 'Location': `${Deno.env.get('SUPABASE_URL').replace('.supabase.co', '.lovable.app')}/settings?error=canvas_oauth_failed` }
    });
  }
});