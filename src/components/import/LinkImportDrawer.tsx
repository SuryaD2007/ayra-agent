import React, { useState } from 'react';
import { Globe2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LinkImportDrawerProps {
  onClose: () => void;
  preselectedSpace: string;
}

export const LinkImportDrawer = ({ onClose, preselectedSpace }: LinkImportDrawerProps) => {
  const [url, setUrl] = useState('');
  const [extractMainContent, setExtractMainContent] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const isValidUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleImport = async () => {
    if (!url.trim() || !isValidUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid HTTP or HTTPS URL",
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

      let title = '';
      let content = '';
      let description = '';

      // If extracting content, scrape the webpage
      if (extractMainContent) {
        const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('scrape-webpage', {
          body: { url, extractContent: true }
        });

        if (scrapeError) {
          console.error('Scraping error:', scrapeError);
          // Fall back to basic import
          const urlObj = new URL(url);
          title = `Article from ${urlObj.hostname}`;
          content = 'Failed to extract content automatically';
        } else if (scrapeData && scrapeData.success) {
          title = scrapeData.title || `Article from ${new URL(url).hostname}`;
          content = scrapeData.content || '';
          description = scrapeData.description || '';
        }
      } else {
        // Basic import without content extraction
        const urlObj = new URL(url);
        title = `Article from ${urlObj.hostname}`;
        content = `Webpage link: ${url}`;
      }

      const { error } = await supabase
        .from('items')
        .insert({
          title: title,
          content: content,
          type: 'link',
          space_id: preselectedSpace === 'overview' ? null : preselectedSpace,
          source: url,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "URL imported successfully",
        description: extractMainContent ? "Content extracted and saved" : "The webpage has been added to your library",
        action: (
          <Button variant="outline" size="sm" onClick={() => window.location.href = `/manage?space=${encodeURIComponent(preselectedSpace)}`}>
            View in Library
          </Button>
        )
      });

      onClose();
    } catch (error) {
      console.error('Error importing URL:', error);
      toast({
        title: "Import failed", 
        description: error.message || "Failed to import URL",
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
          <h2 className="text-xl font-semibold">Import from URL</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Import content from a website or article URL.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="url">Website URL</Label>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="w-full"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="extract-content" 
            checked={extractMainContent}
            onCheckedChange={(checked) => setExtractMainContent(checked === true)}
          />
          <Label htmlFor="extract-content">Extract main text content</Label>
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
              Importing...
            </>
          ) : (
            'Import URL'
          )}
        </Button>
      </div>
    </div>
  );
};