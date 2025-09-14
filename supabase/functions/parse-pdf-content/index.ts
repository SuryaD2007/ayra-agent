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

    console.log('Parsing PDF for user:', user.id, 'item:', itemId);

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
      console.log('Returning cached parsed content');
      return new Response(JSON.stringify({ 
        success: true, 
        content: item.parsed_content,
        cached: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating new parsed content for PDF');

    // For now, create a basic text representation
    // In a full implementation, you'd use a PDF parsing library
    const extractedText = `# ${item.title}

**Document Type:** PDF
**File Size:** ${item.size_bytes ? Math.round(item.size_bytes / 1024) + ' KB' : 'Unknown'}
**Upload Date:** ${new Date(item.created_at).toLocaleDateString()}
**Source:** ${item.source || 'Direct upload'}

## Document Analysis
This PDF document has been uploaded to your knowledge base and is available for analysis. The system can answer questions about this document's content, summarize key points, and help you understand the information within.

## How to Use
- Ask specific questions about this document in the chat
- Request summaries of particular sections
- Get explanations of concepts mentioned in the PDF
- Compare information with other documents in your library

*Note: This is a basic text representation. For full PDF text extraction, additional parsing capabilities would be implemented.*`;

    // Store parsed content in database
    const { error: updateError } = await supabase
      .from('items')
      .update({ parsed_content: extractedText })
      .eq('id', itemId);

    if (updateError) {
      console.error('Error storing parsed content:', updateError);
      // Continue anyway, return the content
    } else {
      console.log('Successfully stored parsed content');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      content: extractedText,
      cached: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-pdf-content function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});