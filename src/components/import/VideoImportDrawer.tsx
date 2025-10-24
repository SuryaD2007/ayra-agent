import React, { useState } from 'react';
import { Video, Loader2, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VideoImportDrawerProps {
  onClose: () => void;
  preselectedSpace: string;
}

export const VideoImportDrawer = ({ onClose, preselectedSpace }: VideoImportDrawerProps) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const isYouTubeUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be');
    } catch {
      return false;
    }
  };

  const handleImport = async () => {
    if (!url.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a YouTube video URL",
        variant: "destructive"
      });
      return;
    }

    if (!isYouTubeUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Process the video transcript
      const { data: videoData, error: videoError } = await supabase.functions.invoke('process-video-transcript', {
        body: {
          url: url.trim(),
          query: 'Provide a comprehensive summary of this video',
          userId: user.id
        }
      });

      if (videoError) throw videoError;

      if (!videoData.success) {
        throw new Error(videoData.error || 'Failed to process video');
      }

      // Create item in database with transcript
      const videoTitle = title.trim() || videoData.videoTitle || 'YouTube Video';
      const content = `${videoData.response}\n\n${notes ? `\n\n## Personal Notes\n${notes}` : ''}`;

      const { error } = await supabase
        .from('items')
        .insert({
          title: videoTitle,
          content: content,
          type: 'link',
          space_id: preselectedSpace === 'overview' ? null : preselectedSpace,
          source: url.trim(),
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Video imported successfully",
        description: "Transcript and summary have been saved",
        action: (
          <Button variant="outline" size="sm" onClick={() => window.location.href = `/manage?space=${encodeURIComponent(preselectedSpace)}`}>
            View in Library
          </Button>
        )
      });

      onClose();
    } catch (error) {
      console.error('Error importing video:', error);
      toast({
        title: "Import failed", 
        description: error.message || "Failed to import video",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Youtube size={20} className="text-red-600" />
            Import YouTube Video
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Import a YouTube video and get an AI-generated transcript and summary.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="video-url">YouTube Video URL *</Label>
          <Input
            id="video-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Enter a YouTube video URL to extract transcript and generate summary
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-title">Custom Title (Optional)</Label>
          <Input
            id="video-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Leave empty to use video title"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Personal Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your own notes about this video..."
            className="w-full min-h-[100px]"
          />
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-2">
            <Video size={16} className="mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">What happens next:</p>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                <li>Video transcript will be extracted</li>
                <li>AI will generate a comprehensive summary</li>
                <li>Content will be saved to your library</li>
                <li>You can search and chat about this video</li>
              </ul>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleImport}
          disabled={!url.trim() || isImporting}
          className="w-full"
          size="lg"
        >
          {isImporting ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Processing video...
            </>
          ) : (
            <>
              <Youtube size={16} className="mr-2" />
              Import Video
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
