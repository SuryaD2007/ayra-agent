import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share, Users, Lock, Folder, Building, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface CustomCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface NewCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryCreated: (category: CustomCategory) => void;
}

const iconOptions = [
  { icon: 'Folder', component: Folder, color: 'text-blue-500' },
  { icon: 'Share', component: Share, color: 'text-blue-500' },
  { icon: 'Users', component: Users, color: 'text-green-500' },
  { icon: 'Lock', component: Lock, color: 'text-amber-500' },
  { icon: 'Building', component: Building, color: 'text-purple-500' },
  { icon: 'Globe', component: Globe, color: 'text-cyan-500' },
];

const NewCategoryModal = ({ open, onOpenChange, onCategoryCreated }: NewCategoryModalProps) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Folder');
  const [selectedColor, setSelectedColor] = useState('text-blue-500');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    setIsCreating(true);
    
    try {
      const newCategory: CustomCategory = {
        id: `custom-${Date.now()}`,
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
      };

      // Save to localStorage
      const existingCategories = JSON.parse(localStorage.getItem('custom-categories') || '[]');
      const updatedCategories = [...existingCategories, newCategory];
      localStorage.setItem('custom-categories', JSON.stringify(updatedCategories));

      onCategoryCreated(newCategory);
      toast.success(`Category "${name}" created successfully!`);
      handleClose();
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setName('');
    setSelectedIcon('Folder');
    setSelectedColor('text-blue-500');
    onOpenChange(false);
  };

  const handleIconSelect = (iconName: string, color: string) => {
    setSelectedIcon(iconName);
    setSelectedColor(color);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">Category Name</Label>
            <Input
              id="categoryName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Work Projects, Personal, Research"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label>Icon & Color</Label>
            <div className="grid grid-cols-3 gap-2">
              {iconOptions.map(({ icon, component: IconComponent, color }) => (
                <button
                  key={icon}
                  type="button"
                  className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
                    selectedIcon === icon && selectedColor === color
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => handleIconSelect(icon, color)}
                >
                  <IconComponent size={20} className={color} />
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              {React.createElement(
                iconOptions.find(opt => opt.icon === selectedIcon)?.component || Folder,
                { size: 16, className: selectedColor }
              )}
              <span className="font-medium">{name || 'Category Name'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Preview</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !name.trim()}>
            {isCreating ? 'Creating...' : 'Create Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewCategoryModal;