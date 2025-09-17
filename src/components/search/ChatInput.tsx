
import React, { useRef, useEffect } from 'react';
import { SearchIcon, SendIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [searchQuery]);

  return (
    <div className="p-4 border-t">
      <form 
        onSubmit={handleSubmit}
        className="relative"
      >
        <div className={cn(
          "w-full glass-panel flex items-start gap-3 px-4 py-3 rounded-2xl transition-all duration-500 ease-out hover-glide",
          isFocused ? "ring-2 ring-primary/30 shadow-lg shadow-primary/10" : "hover:shadow-md"
        )}>
          <SearchIcon 
            size={20} 
            className={cn(
              "text-muted-foreground transition-all duration-300 mt-1",
              isFocused ? "text-primary" : ""
            )} 
          />
          <textarea
            ref={textareaRef}
            placeholder="Ask your second brain anything..."
            className="w-full bg-transparent border-none outline-none focus:outline-none text-foreground resize-none overflow-hidden"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            style={{ 
              minHeight: '24px',
              maxHeight: '120px',
              lineHeight: '1.5'
            }}
          />
          <Button 
            type="submit"
            size="icon"
            variant="ghost"
            className={cn(
              "text-muted-foreground transition-all duration-300 smooth-bounce hover-glow mt-1",
              searchQuery.trim() ? "opacity-100 hover:text-primary" : "opacity-50",
              isFocused && searchQuery.trim() ? "text-primary" : ""
            )}
            disabled={!searchQuery.trim()}
          >
            <SendIcon size={18} />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
