import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Space } from '@/lib/data';

interface NewSpaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSpaceCreated: (space: Space) => void;
  selectedCategory?: string | null;
  onClose?: () => void;
}

// Common emojis for spaces
const spaceEmojis = [
  '🏠', '💼', '🎯', '📚', '🔬', '🎨', '💡', '🚀', 
  '📊', '🛠️', '📝', '💻', '🌟', '🎪', '🌍', '🎮',
  '📱', '🔒', '👥', '📈', '🎵', '🏆', '🎭', '🍕'
];

const NewSpaceModal = ({ open, onOpenChange, onSpaceCreated, selectedCategory, onClose }: NewSpaceModalProps) => {
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🏠');
  const [visibility, setVisibility] = useState<'private' | 'public'>(
    (selectedCategory === 'private' || selectedCategory === 'public') ? selectedCategory : 'private'
  );
  const [isCreating, setIsCreating] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);

  // Load categories on mount
  React.useEffect(() => {
    const defaultCategories = [
      { id: 'private', name: 'Private', emoji: '🔒' },
      { id: 'shared', name: 'Shared', emoji: '🔗' },
      { id: 'team', name: 'Team', emoji: '👥' },
    ];

    try {
      const customCategories = JSON.parse(localStorage.getItem('custom-categories') || '[]');
      const customCategoriesWithEmoji = customCategories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        emoji: cat.icon === 'Folder' ? '📁' : 
               cat.icon === 'Building' ? '🏢' : 
               cat.icon === 'Globe' ? '🌍' : '📁'
      }));
      
      setAvailableCategories([...defaultCategories, ...customCategoriesWithEmoji]);
    } catch (error) {
      setAvailableCategories(defaultCategories);
    }
  }, [open]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name for your space.');
      return;
    }

    setIsCreating(true);
    
    try {
      // Create space in database instead of localStorage
      const { createSpace } = await import('@/lib/data');
      
      const newSpace = await createSpace({
        name: name.trim(),
        emoji: selectedEmoji,
        visibility,
      });

      onSpaceCreated(newSpace);
      
      toast.success(`${selectedEmoji} ${name} has been created successfully.`);

      // Reset form
      setName('');
      setSelectedEmoji('🏠');
      setVisibility((selectedCategory === 'private' || selectedCategory === 'public') ? selectedCategory : 'private');
      if (onClose) {
        onClose();
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error creating space:', error);
      toast.error('Failed to create space. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setName('');
    setSelectedEmoji('🏠');
      setVisibility((selectedCategory === 'private' || selectedCategory === 'public') ? selectedCategory : 'private');
    if (onClose) {
      onClose();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Space</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="space-name">Name *</Label>
            <Input
              id="space-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter space name"
              maxLength={50}
              autoFocus
            />
          </div>

          {/* Emoji Picker */}
          <div className="space-y-2">
            <Label>Choose an emoji</Label>
            <div className="grid grid-cols-8 gap-2 p-2 border rounded-md max-h-32 overflow-y-auto">
              {spaceEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`p-2 text-lg rounded hover:bg-muted transition-colors ${
                    selectedEmoji === emoji ? 'bg-primary/20 ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility Select */}
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={visibility} onValueChange={(value) => setVisibility(value as 'private' | 'public')}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">🔒 Private</SelectItem>
                <SelectItem value="public">🔗 Public</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="p-3 bg-muted/50 rounded-md">
            <div className="text-sm text-muted-foreground mb-1">Preview:</div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedEmoji}</span>
              <span className="font-medium">{name || 'Space Name'}</span>
              <span className="text-xs text-muted-foreground">
                • {visibility === 'private' ? 'Private' : 'Public'}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
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

export default NewSpaceModal;