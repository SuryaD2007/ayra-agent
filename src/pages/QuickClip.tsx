import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, Bookmark } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const QuickClip = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [screenshot, setScreenshot] = useState<string>('');
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [spaces, setSpaces] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Get URL parameters
    const titleParam = searchParams.get('title') || '';
    const urlParam = searchParams.get('url') || '';
    const contentParam = searchParams.get('content') || '';
    const screenshotParam = searchParams.get('screenshot') || '';
    
    setTitle(titleParam);
    setUrl(urlParam);
    setContent(contentParam);
    setScreenshot(screenshotParam);

    // Load spaces
    loadSpaces();
  }, [searchParams]);

  const loadSpaces = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setSpaces(data || []);
      
      // Default to first space
      if (data && data.length > 0) {
        setSelectedSpace(data[0].id);
      }
    } catch (error) {
      console.error('Error loading spaces:', error);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please sign in to save clips',
        variant: 'destructive'
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for this clip',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);

    try {
      let filePath = null;

      // Upload screenshot if exists
      if (screenshot) {
        try {
          // Convert base64 to blob
          const base64Data = screenshot.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/png' });

          // Generate unique filename
          const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.png`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('ayra-files')
            .upload(fileName, blob, {
              contentType: 'image/png',
              upsert: false
            });

          if (uploadError) throw uploadError;
          filePath = fileName;
        } catch (uploadError) {
          console.error('Screenshot upload failed:', uploadError);
          toast({
            title: 'Screenshot upload failed',
            description: 'Saving clip without screenshot',
          });
        }
      }

      const { error } = await supabase
        .from('items')
        .insert({
          title: title.trim(),
          content: content || null,
          source: url || 'Web Clipper',
          type: screenshot ? 'image' : (content ? 'note' : 'link'),
          space_id: selectedSpace || null,
          user_id: user.id,
          file_path: filePath
        });

      if (error) throw error;

      setSaved(true);
      toast({
        title: 'Saved!',
        description: 'Your clip has been saved to Ayra'
      });

      // Close window after 1.5 seconds
      setTimeout(() => {
        window.close();
      }, 1500);
    } catch (error: any) {
      console.error('Error saving clip:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save clip',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <Bookmark className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">Sign In Required</h2>
            <p className="text-muted-foreground">
              Please sign in to save clips to Ayra
            </p>
            <Button onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-500/10 p-3">
                <Check className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <h2 className="text-xl font-semibold">Saved Successfully!</h2>
            <p className="text-muted-foreground">
              Your clip has been saved to Ayra
            </p>
            <p className="text-sm text-muted-foreground">
              This window will close automatically...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-primary" />
              <CardTitle>Quick Clip to Ayra</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this clip"
              />
            </div>

            {url && (
              <div className="space-y-2">
                <Label htmlFor="url">Source URL</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="font-mono text-sm"
                />
              </div>
            )}

            {screenshot && (
              <div className="space-y-2">
                <Label>Page Screenshot</Label>
                <div className="border border-border rounded-lg overflow-hidden">
                  <img 
                    src={screenshot} 
                    alt="Page screenshot" 
                    className="w-full h-auto max-h-[400px] object-contain bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Screenshot captured from the clipped page
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add notes or highlighted text..."
                rows={8}
              />
            </div>

            {spaces.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="space">Save to Space</Label>
                <Select value={selectedSpace} onValueChange={setSelectedSpace}>
                  <SelectTrigger id="space">
                    <SelectValue placeholder="Select a space" />
                  </SelectTrigger>
                  <SelectContent>
                    {spaces.map(space => (
                      <SelectItem key={space.id} value={space.id}>
                        {space.emoji} {space.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save to Ayra
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.close()}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuickClip;
