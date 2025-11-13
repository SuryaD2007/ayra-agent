import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encryptToken } from '../_shared/encryption.ts';

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
    
    if (!code || !state) {
      throw new Error('Missing authorization code or state');
    }

    const { service, userId, origin } = JSON.parse(state);
    const appUrl = origin || 'https://useayra.com';
    
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    const redirectUri = `${supabaseUrl}/functions/v1/google-oauth-callback`;
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      throw new Error('Failed to exchange authorization code');
    }

    const tokens = await tokenResponse.json();
    
    const supabaseClient = createClient(
      supabaseUrl ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Encrypt tokens before storing
    const encryptedAccessToken = await encryptToken(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token ? await encryptToken(tokens.refresh_token) : null;
    
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    
    const { data: existing } = await supabaseClient
      .from('google_integrations')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const updateData: any = {
        access_token: encryptedAccessToken,
        token_expires_at: expiresAt,
      };
      
      if (encryptedRefreshToken) updateData.refresh_token = encryptedRefreshToken;
      if (service === 'drive') updateData.drive_enabled = true;
      if (service === 'calendar') updateData.calendar_enabled = true;

      await supabaseClient
        .from('google_integrations')
        .update(updateData)
        .eq('user_id', userId);
    } else {
      await supabaseClient
        .from('google_integrations')
        .insert({
          user_id: userId,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expires_at: expiresAt,
          drive_enabled: service === 'drive',
          calendar_enabled: service === 'calendar',
        });
    }

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${appUrl}/settings?google_connected=true`,
      },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    // Fallback to default domain if origin is not in state
    const fallbackUrl = 'https://useayra.com';
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${fallbackUrl}/settings?google_error=${encodeURIComponent(error.message)}`,
      },
    });
  }
});
