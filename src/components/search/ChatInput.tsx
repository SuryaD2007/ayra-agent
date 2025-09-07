import React, { useState } from 'react';
import { Search, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Ask your second brain anything..."
}) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const canSend = input.trim().length > 0 && !disabled;

  return (
    <div className="p-6 border-t border-border/50">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className={cn(
          "glass-panel rounded-2xl p-4 transition-all duration-200",
          isFocused && "ring-2 ring-primary/30"
        )}>
          <div className="flex items-center gap-3">
            {/* Search Icon */}
            <Search className={cn(
              "w-5 h-5 transition-colors",
              isFocused ? "text-primary" : "text-muted-foreground"
            )} />

            {/* Input Field */}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            />

            {/* Send Button */}
            <Button
              type="submit"
              size="sm"
              disabled={!canSend}
              className={cn(
                "rounded-full w-8 h-8 p-0 transition-all duration-200",
                canSend 
                  ? "opacity-100" 
                  : "opacity-50"
              )}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};