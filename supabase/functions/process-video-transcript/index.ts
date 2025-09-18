import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Fetch transcript from YouTube using a third-party API or scraping approach
async function getVideoTranscript(videoId: string): Promise<string> {
  try {
    // Using youtube-transcript-api approach
    const response = await fetch(`https://api.streamelements.com/kappa/v2/youtube/video/${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch video data');
    }
    
    const videoData = await response.json();
    
    // Try to get captions/transcript
    const transcriptResponse = await fetch(`https://youtube-transcript3.p.rapidapi.com/youtube/transcript?url=https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'X-RapidAPI-Key': 'demo-key', // You'll need to get a proper API key
        'X-RapidAPI-Host': 'youtube-transcript3.p.rapidapi.com'
      }
    }).catch(() => null);
    
    if (transcriptResponse && transcriptResponse.ok) {
      const transcriptData = await transcriptResponse.json();
      if (transcriptData.transcript) {
        return transcriptData.transcript;
      }
    }
    
    // Fallback: Use video description and title as content
    return `Title: ${videoData.title || 'Unknown'}\nDescription: ${videoData.description || 'No description available'}`;
    
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw new Error('Unable to extract video content. The video may not have captions available.');
  }
}

// Process transcript with OpenAI
async function processTranscriptWithAI(transcript: string, userQuery?: string): Promise<string> {
  const systemPrompt = userQuery 
    ? `You are an AI assistant that analyzes video transcripts. The user has provided a video transcript and wants you to: ${userQuery}. Please provide a helpful response based on the content.`
    : `You are an AI assistant that analyzes video transcripts. Please provide a comprehensive summary of the following video transcript, including key points, main topics, and important takeaways.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Video transcript:\n\n${transcript}` }
      ],
      max_tokens: 1500,
      temperature: 0.7
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, query, userId } = await req.json();
    
    console.log('Processing video URL:', url);
    
    if (!url) {
      throw new Error('URL is required');
    }

    // Extract video ID
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL provided');
    }

    console.log('Extracted video ID:', videoId);

    // Check if we already have this video processed
    const { data: existingVideo } = await supabase
      .from('processed_videos')
      .select('*')
      .eq('video_id', videoId)
      .single();

    let transcript: string;
    let videoTitle: string = 'Unknown Video';

    if (existingVideo) {
      console.log('Using cached video data');
      transcript = existingVideo.transcript;
      videoTitle = existingVideo.title;
    } else {
      console.log('Fetching new transcript');
      transcript = await getVideoTranscript(videoId);
      
      // Extract title from transcript if available
      const titleMatch = transcript.match(/Title: ([^\n]+)/);
      if (titleMatch) {
        videoTitle = titleMatch[1];
      }

      // Cache the video data
      await supabase
        .from('processed_videos')
        .upsert({
          video_id: videoId,
          url,
          title: videoTitle,
          transcript,
          processed_at: new Date().toISOString()
        });
    }

    // Process with AI
    console.log('Processing with AI');
    const aiResponse = await processTranscriptWithAI(transcript, query);

    // Store the interaction if userId is provided
    if (userId) {
      await supabase
        .from('video_interactions')
        .insert({
          user_id: userId,
          video_id: videoId,
          video_url: url,
          video_title: videoTitle,
          user_query: query || 'Summary request',
          ai_response: aiResponse,
          created_at: new Date().toISOString()
        });
    }

    return new Response(JSON.stringify({
      success: true,
      videoId,
      videoTitle,
      response: aiResponse,
      transcript: transcript.length > 2000 ? transcript.substring(0, 2000) + '...' : transcript
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-video-transcript function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});