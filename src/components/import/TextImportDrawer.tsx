import React, { useState } from 'react';
import { Type, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TextImportDrawerProps {
  onClose: () => void;
  preselectedSpace: string;
}

export const TextImportDrawer = ({ onClose, preselectedSpace }: TextImportDrawerProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [space, setSpace] = useState(preselectedSpace);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your text",
        variant: "destructive"
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Content required", 
        description: "Please enter some content",
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
          content: content.trim(),
          type: 'note',
          space: space,
          tags: tagsArray,
          source: 'text-input',
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Text created successfully",
        description: "Your text has been added to your library",
        action: (
          <Button variant="outline" size="sm" onClick={() => window.location.href = `/manage?space=${encodeURIComponent(space)}`}>
            View in Library
          </Button>
        )
      });

      onClose();
    } catch (error) {
      console.error('Error creating text:', error);
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create text",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Type size={20} />
            Add Text Content
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Directly input or paste text content into your library.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title for your text"
            className="w-full"
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="content">Content *</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter or paste your text content here..."
            className="min-h-[200px] resize-none"
          />
        </div>

        {/* Tags */}
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

        {/* Space Selection */}
        <div className="space-y-2">
          <Label htmlFor="space">Space</Label>
          <Select value={space} onValueChange={setSpace}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Personal (No Space)</SelectItem>
              <SelectItem value="Work">Work</SelectItem>
              <SelectItem value="Projects">Projects</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-row gap-2 justify-end pt-6 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreate}
          disabled={!title.trim() || !content.trim() || isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Creating...
            </>
          ) : (
            'Create Text'
          )}
        </Button>
      </div>
    </div>
  );
};