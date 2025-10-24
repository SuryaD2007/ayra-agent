import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Share, Users, Lock, Folder, Building, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { createSpace } from '@/lib/data';

interface CustomCategory {
  id: string;
  name: string;
  emoji?: string;
  visibility: 'private' | 'public';
}

interface NewCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryCreated: (category: CustomCategory) => void;
}

const emojiOptions = ['📁', '🗂️', '📊', '🎯', '💼', '🔒', '🌟', '⚡', '🚀', '💡', '🎨', '📚'];

const NewCategoryModal = ({ open, onOpenChange, onCategoryCreated }: NewCategoryModalProps) => {
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📁');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a space name');
      return;
    }

    setIsCreating(true);
    
    try {
      const newSpace = await createSpace({
        name: name.trim(),
        emoji: selectedEmoji,
        visibility: visibility,
      });

      const category: CustomCategory = {
        id: newSpace.id,
        name: newSpace.name,
        emoji: newSpace.emoji,
        visibility: newSpace.visibility as 'private' | 'public',
      };

      onCategoryCreated(category);
      toast.success(`Space "${name}" created successfully!`);
      handleClose();
    } catch (error) {
      console.error('Error creating space:', error);
      toast.error('Failed to create space');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setName('');
    setSelectedEmoji('📁');
    setVisibility('private');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Space</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="spaceName">Space Name</Label>
            <Input
              id="spaceName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Work Projects, Personal, Research"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label>Emoji Icon</Label>
            <div className="grid grid-cols-6 gap-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`flex items-center justify-center p-3 rounded-lg border transition-colors text-2xl ${
                    selectedEmoji === emoji
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Private - Only you
                  </div>
                </SelectItem>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Share className="w-4 h-4" />
                    Public - Everyone
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xl">{selectedEmoji}</span>
              <span className="font-medium">{name || 'Space Name'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Preview</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !name.trim()}>
            {isCreating ? 'Creating...' : 'Create Space'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewCategoryModal;