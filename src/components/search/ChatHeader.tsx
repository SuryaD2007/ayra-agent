import React from 'react';
import { Search } from 'lucide-react';

interface ChatHeaderProps {
  chatTitle: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  chatTitle,
}) => {
  return (
    <div className="px-6 py-4 border-b border-border/50">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <h1 className="text-lg font-medium">{chatTitle}</h1>
      </div>
    </div>
  );
};