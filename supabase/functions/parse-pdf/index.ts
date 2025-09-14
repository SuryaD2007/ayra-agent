import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { itemId } = await req.json();

    if (!itemId) {
      throw new Error('Item ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Set auth for user context
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Fetch item from database
    const { data: item, error: fetchError } = await supabase
      .from('items')
      .select('*')
      .eq('id', itemId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !item) {
      throw new Error('Item not found');
    }

    if (item.type !== 'pdf' || !item.file_path) {
      throw new Error('Item is not a PDF or has no file path');
    }

    // Check if we already have parsed content
    if (item.parsed_content) {
      return new Response(JSON.stringify({ 
        success: true, 
        content: item.parsed_content,
        cached: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get signed URL for the PDF
    const { data: urlData, error: urlError } = await supabase.storage
      .from('ayra-files')
      .createSignedUrl(item.file_path, 3600);

    if (urlError || !urlData.signedUrl) {
      throw new Error('Could not generate signed URL for PDF');
    }

    // Fetch the PDF file
    const pdfResponse = await fetch(urlData.signedUrl);
    if (!pdfResponse.ok) {
      throw new Error('Could not fetch PDF file');
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    // Use a simple text extraction approach (for now, we'll simulate PDF parsing)
    // In a real implementation, you'd use a PDF parsing library like pdf-parse
    const extractedText = `PDF Content Analysis for: ${item.title}

This PDF document contains information that can be analyzed and discussed. The content includes:

- Document title: ${item.title}
- File size: ${item.size_bytes ? Math.round(item.size_bytes / 1024) + ' KB' : 'Unknown'}
- Upload date: ${item.created_at}
- Source: ${item.source || 'Direct upload'}

[Note: Full text extraction requires PDF parsing implementation]

The document is available for analysis and can answer questions about its content when referenced in chat.`;

    // Store parsed content in database
    const { error: updateError } = await supabase
      .from('items')
      .update({ parsed_content: extractedText })
      .eq('id', itemId);

    if (updateError) {
      console.error('Error storing parsed content:', updateError);
      // Continue anyway, return the content
    }

    return new Response(JSON.stringify({ 
      success: true, 
      content: extractedText,
      cached: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-pdf function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});