import React, { useState } from 'react';
import { X, Globe2, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LinkImportDrawerProps {
  onClose: () => void;
  preselectedSpace: string;
}

interface LinkMetadata {
  title: string;
  description: string;
  domain: string;
  url: string;
}

export const LinkImportDrawer = ({ onClose, preselectedSpace }: LinkImportDrawerProps) => {
  const [url, setUrl] = useState('');
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [space, setSpace] = useState(preselectedSpace);
  const [isFetching, setIsFetching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const isValidUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const fetchMetadata = async () => {
    if (!url.trim() || !isValidUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid HTTP or HTTPS URL",
        variant: "destructive"
      });
      return;
    }

    setIsFetching(true);
    try {
      // Mock metadata extraction - in real implementation, you'd use a service like
      // Open Graph scraping, microlink.io, or similar
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockMetadata: LinkMetadata = {
        title: `Article from ${domain}`,
        description: 'Fetched content description from the webpage',
        domain: domain,
        url: url
      };

      setMetadata(mockMetadata);
      setTitle(mockMetadata.title);
      setDescription(mockMetadata.description);
      
      toast({
        title: "Metadata fetched",
        description: "You can now edit the title and description",
      });
    } catch (error) {
      console.error('Error fetching metadata:', error);
      toast({
        title: "Failed to fetch metadata",
        description: "Using URL as title. You can edit the details below.",
        variant: "destructive"
      });
      
      // Fallback metadata
      const urlObj = new URL(url);
      setMetadata({
        title: url,
        description: '',
        domain: urlObj.hostname,
        url: url
      });
      setTitle(url);
    } finally {
      setIsFetching(false);
    }
  };

  const handleCreate = async () => {
    if (!metadata || !title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the link",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

      const { error } = await supabase
        .from('items')
        .insert({
          title: title.trim(),
          content: description.trim() || 'No description available',
          type: 'link',
          space: space,
          tags: tagsArray,
          source: 'url-import',
          external_url: metadata.url,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Link imported successfully",
        description: "The webpage has been added to your library",
        action: (
          <Button variant="outline" size="sm" onClick={() => window.location.href = `/manage?space=${encodeURIComponent(space)}`}>
            View in Library
          </Button>
        )
      });

      onClose();
    } catch (error) {
      console.error('Error creating link:', error);
      toast({
        title: "Import failed",
        description: error.message || "Failed to import link",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle className="flex items-center gap-2">
          <Globe2 size={20} />
          Import from URL
        </DrawerTitle>
        <DrawerClose className="absolute right-4 top-4">
          <X size={20} />
        </DrawerClose>
      </DrawerHeader>

      <div className="px-6 space-y-6">
        {/* URL Input */}
        <div className="space-y-2">
          <Label htmlFor="url">Website URL *</Label>
          <div className="flex gap-2">
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="flex-1"
            />
            <Button 
              onClick={fetchMetadata}
              disabled={!url.trim() || isFetching}
              variant="outline"
            >
              {isFetching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                'Fetch'
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter a URL to automatically fetch title and description
          </p>
        </div>

        {/* Metadata Preview */}
        {metadata && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <Badge variant="secondary" className="text-xs">
                  {metadata.domain}
                </Badge>
                <Button variant="ghost" size="sm" asChild>
                  <a href={metadata.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={14} />
                  </a>
                </Button>
              </div>
              
              {/* Editable Title */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title"
                />
              </div>

              {/* Editable Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                  className="min-h-[80px] resize-none"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        {metadata && (
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Add tags (comma-separated)"
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple tags with commas
            </p>
          </div>
        )}

        {/* Space Selection */}
        {metadata && (
          <div className="space-y-2">
            <Label htmlFor="space">Space</Label>
            <Select value={space} onValueChange={setSpace}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Personal">Personal</SelectItem>
                <SelectItem value="Work">Work</SelectItem>
                <SelectItem value="Projects">Projects</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <DrawerFooter className="flex flex-row gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        {metadata && (
          <Button 
            onClick={handleCreate}
            disabled={!title.trim() || isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Link'
            )}
          </Button>
        )}
      </DrawerFooter>
    </DrawerContent>
  );
};