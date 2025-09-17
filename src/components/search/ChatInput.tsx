
import React from 'react';
import { SearchIcon, SendIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  searchQuery,
  setSearchQuery,
  handleSubmit,
  isFocused,
  setIsFocused
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="p-4 border-t">
      <form 
        onSubmit={handleSubmit}
        className="relative"
      >
        <div 
          className={cn(
            "w-full glass-panel flex items-end gap-3 px-4 py-3 rounded-2xl transition-all duration-500 ease-out hover-glide cursor-text",
            isFocused ? "ring-2 ring-primary/30 shadow-lg shadow-primary/10" : "hover:shadow-md"
          )}
          onClick={() => {
            const textarea = document.querySelector('textarea');
            textarea?.focus();
          }}
        >
          <SearchIcon 
            size={20} 
            className={cn(
              "text-muted-foreground transition-all duration-300 flex-shrink-0 mb-2 pointer-events-none",
              isFocused ? "text-primary" : ""
            )} 
          />
          <Textarea
            placeholder="Ask your second brain anything... (Shift+Enter for new line)"
            className="w-full bg-transparent border-none outline-none focus:outline-none text-foreground resize-none min-h-[20px] max-h-32 px-0 py-0 cursor-text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{ 
              height: 'auto',
              minHeight: '20px'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />
          <Button 
            type="submit"
            size="icon"
            variant="ghost"
            className={cn(
              "text-muted-foreground transition-all duration-300 smooth-bounce hover-glow flex-shrink-0",
              searchQuery.trim() ? "opacity-100 hover:text-primary" : "opacity-50",
              isFocused && searchQuery.trim() ? "text-primary" : ""
            )}
            disabled={!searchQuery.trim()}
          >
            <SendIcon size={18} />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-2 text-center">
          Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send • <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift + Enter</kbd> for new line
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
