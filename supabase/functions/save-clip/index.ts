import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Save clip function started');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, title, url, content, screenshot } = await req.json();

    if (!userId || !title) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Finding or creating Screenshots space for user:', userId);

    // Find or create "Screenshots" space for the user
    let { data: space, error: spaceError } = await supabase
      .from('spaces')
      .select('id')
      .eq('user_id', userId)
      .eq('name', 'Screenshots')
      .maybeSingle();

    if (spaceError) {
      console.error('Error finding space:', spaceError);
      return new Response(
        JSON.stringify({ error: 'Failed to find space' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Screenshots space if it doesn't exist
    if (!space) {
      console.log('Creating Screenshots space');
      const { data: newSpace, error: createError } = await supabase
        .from('spaces')
        .insert({
          user_id: userId,
          name: 'Screenshots',
          emoji: '📸',
          visibility: 'private'
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating space:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create space' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      space = newSpace;
    }

    console.log('Screenshots space ID:', space.id);

    let filePath = null;

    // Upload screenshot if exists
    if (screenshot) {
      try {
        console.log('Processing screenshot upload');
        
        // Convert base64 to blob
        const base64Data = screenshot.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        // Generate unique filename
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.png`;

        console.log('Uploading screenshot to storage:', fileName);

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('ayra-files')
          .upload(fileName, byteArray, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) {
          console.error('Screenshot upload failed:', uploadError);
        } else {
          filePath = fileName;
          console.log('Screenshot uploaded successfully');
        }
      } catch (uploadError) {
        console.error('Screenshot processing error:', uploadError);
      }
    }

    console.log('Saving item to database');

    // Save the item
    const { error: itemError } = await supabase
      .from('items')
      .insert({
        title: title.trim(),
        content: content || null,
        source: url || 'Web Clipper',
        type: 'screenshot',
        space_id: space.id,
        user_id: userId,
        file_path: filePath
      });

    if (itemError) {
      console.error('Error saving item:', itemError);
      return new Response(
        JSON.stringify({ error: 'Failed to save item' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Clip saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Clip saved successfully',
        spaceId: space.id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Save clip error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
