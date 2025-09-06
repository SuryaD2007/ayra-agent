import React from 'react';
import { HelpCircle, Search, Filter, Plus, ArrowUp, ArrowDown, CornerDownLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface HotkeyItem {
  key: string;
  description: string;
  icon?: React.ReactNode;
}

const hotkeys: HotkeyItem[] = [
  {
    key: '/',
    description: 'Focus search input',
    icon: <Search size={16} />
  },
  {
    key: 'F',
    description: 'Open filters drawer',
    icon: <Filter size={16} />
  },
  {
    key: 'N',
    description: 'Create new item',
    icon: <Plus size={16} />
  },
  {
    key: 'J',
    description: 'Move selection down',
    icon: <ArrowDown size={16} />
  },
  {
    key: 'K',
    description: 'Move selection up',
    icon: <ArrowUp size={16} />
  },
  {
    key: '↵',
    description: 'Open preview for selected item',
    icon: <CornerDownLeft size={16} />
  },
  {
    key: 'Esc',
    description: 'Close preview drawer',
    icon: <X size={16} />
  },
];

const HotkeysSheet = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-md"
          title="Keyboard shortcuts"
        >
          <HelpCircle size={16} />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle size={20} />
            Keyboard Shortcuts
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <div className="space-y-3">
            {hotkeys.map((hotkey, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 text-muted-foreground">
                    {hotkey.icon}
                  </div>
                  <span className="text-sm">{hotkey.description}</span>
                </div>
                <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                  {hotkey.key}
                </Badge>
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          <div className="text-xs text-muted-foreground space-y-2">
            <p>
              • Navigation shortcuts work in table view
            </p>
            <p>
              • Use Tab to navigate between UI elements
            </p>
            <p>
              • Hotkeys are disabled when typing in inputs
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HotkeysSheet;