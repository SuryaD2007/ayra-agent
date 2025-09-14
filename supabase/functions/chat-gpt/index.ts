import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const { messages, context } = await req.json();
    console.log('Received request:', { messages, context });

    // Prepare system message with context
    const systemMessage = {
      role: 'system',
      content: context 
        ? `You are a helpful AI assistant for a knowledge management system. You have access to the user's documents, notes, and saved content. Here is the relevant context: ${context}. Use this context to provide helpful, accurate responses to user questions about their content.`
        : 'You are a helpful AI assistant for a knowledge management system. Help users search through and understand their documents, notes, and saved content.'
    };

    // Prepare messages for OpenAI
    const openAIMessages = [
      systemMessage,
      ...messages.map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    ];

    console.log('Sending to OpenAI:', { messages: openAIMessages });

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
    console.log('OpenAI response:', data);

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