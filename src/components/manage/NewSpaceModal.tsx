import React, { useState } from 'react';
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
import { toast } from '@/hooks/use-toast';

interface NewSpaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSpaceCreated: (space: { id: string; name: string; emoji: string; visibility: 'Private' | 'Team'; slug: string }) => void;
  defaultVisibility?: 'Private' | 'Team';
}

// Common emojis for spaces
const spaceEmojis = [
  '🏠', '💼', '🎯', '📚', '🔬', '🎨', '💡', '🚀', 
  '📊', '🛠️', '📝', '💻', '🌟', '🎪', '🌍', '🎮',
  '📱', '🔒', '👥', '📈', '🎵', '🏆', '🎭', '🍕'
];

const NewSpaceModal = ({ open, onOpenChange, onSpaceCreated, defaultVisibility = 'Private' }: NewSpaceModalProps) => {
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🏠');
  const [visibility, setVisibility] = useState<'Private' | 'Team'>(defaultVisibility);
  const [isCreating, setIsCreating] = useState(false);

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
      toast({
        title: "Name required",
        description: "Please enter a name for your space.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    try {
      const slug = generateSlug(name);
      const newSpace = {
        id: `space-${Date.now()}`,
        name: name.trim(),
        emoji: selectedEmoji,
        visibility,
        slug,
      };

      // Save to localStorage (in a real app, this would be an API call)
      const existingSpaces = JSON.parse(localStorage.getItem('custom-spaces') || '[]');
      const updatedSpaces = [...existingSpaces, newSpace];
      localStorage.setItem('custom-spaces', JSON.stringify(updatedSpaces));

      onSpaceCreated(newSpace);
      
      toast({
        title: "Space created",
        description: `${selectedEmoji} ${name} has been created successfully.`,
      });

      // Reset form
      setName('');
      setSelectedEmoji('🏠');
      setVisibility(defaultVisibility);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create space. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setName('');
    setSelectedEmoji('🏠');
    setVisibility(defaultVisibility);
    onOpenChange(false);
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
            <Select value={visibility} onValueChange={(value) => setVisibility(value as 'Private' | 'Team')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Private">
                  🔒 Private - Only you can see this space
                </SelectItem>
                <SelectItem value="Team">
                  👥 Team - Team members can see this space
                </SelectItem>
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
                • {visibility}
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