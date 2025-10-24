import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchResult {
  id: string;
  title: string;
  type: string;
  content: string;
  source?: string;
  relevanceScore: number;
}

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

    const { messages, context, itemId, searchQuery } = await req.json();
    console.log('Received request:', { messages, context, itemId, searchQuery });

    // Initialize Supabase client for document context
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header for user context
    const authHeader = req.headers.get('Authorization');
    let documentContext = '';
    const sources: SearchResult[] = [];
    
    // Process attached files if present
    if (context?.fileContents && context.fileContents.length > 0) {
      const filesText = context.fileContents
        .map((file: any) => `File: ${file.name} (${file.type})\n\n${file.content}`)
        .join('\n\n---\n\n');
      documentContext += filesText;
    }

    // Search across user's items if this is a search query
    if (authHeader && searchQuery) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          // Search for relevant items using text matching
          const { data: searchResults, error: searchError } = await supabase
            .from('items')
            .select('id, title, content, parsed_content, type, source, file_path')
            .eq('user_id', user.id)
            .is('deleted_at', null)
            .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,parsed_content.ilike.%${searchQuery}%`)
            .limit(5);

          if (searchError) {
            console.error('Search error:', searchError);
          } else if (searchResults && searchResults.length > 0) {
            console.log(`Found ${searchResults.length} relevant items`);
            
            // Build context from search results
            const searchContext = searchResults.map((item, index) => {
              const content = item.parsed_content || item.content || '';
              const preview = content.slice(0, 500); // Limit to first 500 chars per item
              
              sources.push({
                id: item.id,
                title: item.title,
                type: item.type,
                content: preview,
                source: item.source,
                relevanceScore: 1 - (index * 0.1) // Simple relevance scoring
              });
              
              return `[Source ${index + 1}] "${item.title}" (${item.type})\n${preview}${content.length > 500 ? '...' : ''}`;
            }).join('\n\n---\n\n');
            
            documentContext = documentContext 
              ? `${documentContext}\n\n---\n\n${searchContext}`
              : searchContext;
          }
        }
      } catch (error) {
        console.error('Error searching items:', error);
      }
    }
    
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
            let content = item.parsed_content || item.content || '';
            
            // If it's a PDF without parsed content, try to parse it
            if (item.type === 'pdf' && !content && item.file_path) {
              try {
                const { data: parseData } = await supabase.functions.invoke('parse-pdf-content', {
                  body: { itemId: item.id },
                  headers: { Authorization: authHeader }
                });
                
                if (parseData?.success && parseData?.content) {
                  content = parseData.content;
                }
              } catch (parseError) {
                console.error('Error parsing PDF:', parseError);
                content = `PDF Document: "${item.title}"\n\nThis PDF is available for analysis. You can ask me questions about its content, and I'll do my best to help based on the document structure and metadata.`;
              }
            }
            
            const itemContext = `Document: "${item.title}" (${item.type})\n${content}`;
            documentContext = documentContext 
              ? `${documentContext}\n\n---\n\n${itemContext}`
              : itemContext;
          }
        }
      } catch (error) {
        console.error('Error fetching specific document:', error);
      }
    }

    // Prepare system message with context
    const isSearchMode = searchQuery && sources.length > 0;
    const systemMessage = {
      role: 'system',
      content: documentContext 
        ? `You are Ayra, an intelligent AI assistant for a knowledge management system called Ayra. You help users understand and work with their documents, PDFs, notes, and saved content.

${isSearchMode ? `The user searched for: "${searchQuery}"\n\nI found ${sources.length} relevant items from their knowledge base:` : 'You have access to the following document content:'}

${documentContext}

${isSearchMode ? 'When answering, cite specific sources using their numbers [Source 1], [Source 2], etc. Synthesize information from multiple sources when relevant. Be specific about which source each piece of information comes from.' : 'Use this context to provide helpful, accurate responses. When referencing the document, be specific about which parts you\'re discussing.'}

If the user asks about something not covered in the provided content, let them know and suggest they upload relevant documents or refine their search.`
        : 'You are Ayra, an intelligent AI assistant for a knowledge management system. Help users search through and understand their documents, notes, PDFs, and saved content. Ask them to reference specific documents or perform a search if you need more context.'
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
      sources: sources.length > 0 ? sources : undefined,
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