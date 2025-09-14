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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { messages, context, itemId } = await req.json();
    console.log('Received request:', { messages, context, itemId });

    // Initialize Supabase client for document context
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header for user context
    const authHeader = req.headers.get('Authorization');
    let documentContext = context || '';
    
    // If itemId is provided, fetch specific document content
    if (authHeader && itemId) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          const { data: item } = await supabase
            .from('items')
            .select('id, title, content, parsed_content, type, file_path')
            .eq('id', itemId)
            .eq('user_id', user.id)
            .single();

          if (item) {
            const content = item.parsed_content || item.content || '';
            documentContext = `Document: "${item.title}" (${item.type})\n${content}`;
          }
        }
      } catch (error) {
        console.error('Error fetching specific document:', error);
      }
    }

    // Prepare system message with context
    const systemMessage = {
      role: 'system',
      content: documentContext 
        ? `You are Ayra, an intelligent AI assistant for a knowledge management system called Ayra. You help users understand and work with their documents, PDFs, notes, and saved content. You have access to the following document content: 

${documentContext}

Use this context to provide helpful, accurate responses. When referencing the document, be specific about which parts you're discussing. If the user asks about something not covered in the provided content, let them know you need more context or suggest they upload relevant documents.`
        : 'You are Ayra, an intelligent AI assistant for a knowledge management system. Help users search through and understand their documents, notes, PDFs, and saved content. Ask them to reference specific documents if you need more context.'
    };

    // Prepare messages for OpenAI
    const openAIMessages = [
      systemMessage,
      ...messages.map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    ];

    console.log('Sending to OpenAI with document context');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openAIMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    const generatedResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      response: generatedResponse,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-gpt function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});