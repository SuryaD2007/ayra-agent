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

// Get video metadata and transcript using YouTube's oembed API and other methods
async function getVideoTranscript(videoId: string): Promise<{ title: string; content: string }> {
  try {
    console.log('Fetching video metadata for:', videoId);
    
    // Get basic video info from YouTube oEmbed API
    const oembedResponse = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (!oembedResponse.ok) {
      throw new Error('Failed to fetch video metadata');
    }
    
    const videoData = await oembedResponse.json();
    const title = videoData.title || 'Unknown Video';
    const author = videoData.author_name || 'Unknown Author';
    
    console.log('Video found:', title, 'by', author);
    
    // Try to get transcript using a direct approach
    try {
      const transcriptUrl = `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`;
      const transcriptResponse = await fetch(transcriptUrl);
      
      if (transcriptResponse.ok) {
        const transcriptXML = await transcriptResponse.text();
        
        // Simple XML parsing to extract text content
        const textMatches = transcriptXML.match(/<text[^>]*>([^<]*)<\/text>/g);
        if (textMatches && textMatches.length > 0) {
          const transcript = textMatches
            .map(match => match.replace(/<[^>]*>/g, '').trim())
            .filter(text => text.length > 0)
            .join(' ');
          
          if (transcript.length > 100) {
            console.log('Transcript extracted successfully');
            return {
              title,
              content: `Title: ${title}\nAuthor: ${author}\n\nTranscript:\n${transcript}`
            };
          }
        }
      }
    } catch (transcriptError) {
      console.log('Transcript extraction failed, using video metadata only');
    }
    
    // Fallback: Use video metadata as content
    const fallbackContent = `Title: ${title}\nAuthor: ${author}\n\nThis video appears to be "${title}" by ${author}. Unfortunately, no transcript is available for this video. This could be because:\n1. The video doesn't have captions/subtitles\n2. The captions are auto-generated and not accessible via API\n3. The video is private or restricted\n\nTo get better analysis, you could:\n- Provide a summary of the video content\n- Share key points you'd like me to focus on\n- Ask specific questions about the video topic`;
    
    return {
      title,
      content: fallbackContent
    };
    
  } catch (error) {
    console.error('Error fetching video data:', error);
    throw new Error('Unable to access this YouTube video. Please check if the URL is correct and the video is publicly available.');
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

    let videoData: { title: string; content: string };
    let videoTitle: string = 'Unknown Video';

    if (existingVideo) {
      console.log('Using cached video data');
      videoData = {
        title: existingVideo.title,
        content: existingVideo.transcript
      };
      videoTitle = existingVideo.title;
    } else {
      console.log('Fetching new transcript');
      videoData = await getVideoTranscript(videoId);
      videoTitle = videoData.title;

      // Cache the video data
      await supabase
        .from('processed_videos')
        .upsert({
          video_id: videoId,
          url,
          title: videoTitle,
          transcript: videoData.content,
          processed_at: new Date().toISOString()
        });
    }

    // Process with AI
    console.log('Processing with AI');
    const aiResponse = await processTranscriptWithAI(videoData.content, query);

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
      transcript: videoData.content.length > 2000 ? videoData.content.substring(0, 2000) + '...' : videoData.content
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