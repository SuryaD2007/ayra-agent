import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link, Play, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LinkProcessorProps {
  onContentProcessed: (content: string, title: string) => void;
  className?: string;
}

interface ProcessedContent {
  videoId: string;
  videoTitle: string;
  response: string;
  transcript: string;
}

export function LinkProcessor({ onContentProcessed, className }: LinkProcessorProps) {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedContent, setProcessedContent] = useState<ProcessedContent | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const isYouTubeUrl = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/,
      /youtube\.com\/watch\?.*v=/
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  const processVideo = async (query?: string) => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    if (!isYouTubeUrl(url)) {
      toast({
        title: "Error", 
        description: "Currently only YouTube videos are supported",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('process-video-transcript', {
        body: {
          url: url.trim(),
          query: query || 'Provide a comprehensive summary of this video',
          userId: user?.id
        }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to process video');
      }

      setProcessedContent(data);
      onContentProcessed(data.response, data.videoTitle);
      
      toast({
        title: "Success",
        description: "Video processed successfully!",
      });

    } catch (error) {
      console.error('Error processing video:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process video",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processVideo();
  };

  const handleCustomQuery = () => {
    if (!customQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question or request",
        variant: "destructive",
      });
      return;
    }
    processVideo(customQuery);
  };

  return (
    <Card className={cn("p-6 space-y-4", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Link size={20} className="text-primary" />
        <h3 className="text-lg font-semibold">Process Video Content</h3>
        <Badge variant="secondary" className="ml-auto">
          <Play size={12} className="mr-1" />
          YouTube
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="video-url" className="text-sm font-medium">
            Video URL
          </label>
          <Input
            id="video-url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full"
          />
        </div>

        <Button 
          type="submit" 
          disabled={isProcessing || !url.trim()}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Processing Video...
            </>
          ) : (
            <>
              <Play size={16} className="mr-2" />
              Get Summary
            </>
          )}
        </Button>
      </form>

      {processedContent && (
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Video Processed Successfully
            </span>
          </div>
          
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold mb-1">Video Title</h4>
              <p className="text-sm text-muted-foreground">{processedContent.videoTitle}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Ask specific questions about this video:</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., What are the main takeaways? Key points? Action items?"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCustomQuery();
                    }
                  }}
                />
                <Button 
                  onClick={handleCustomQuery}
                  disabled={isProcessing || !customQuery.trim()}
                  size="sm"
                >
                  {isProcessing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    'Ask'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1 mb-1">
          <AlertCircle size={12} />
          <span>Supported formats:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>YouTube videos with available captions/transcripts</li>
          <li>Public videos (not private or restricted)</li>
        </ul>
      </div>
    </Card>
  );
}