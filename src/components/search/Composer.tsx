import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Paperclip, 
  Square, 
  Command,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComposerProps {
  onSendMessage: (message: string) => void;
  onAttachFile?: () => void;
  onAttachUrl?: () => void;
  isStreaming?: boolean;
  onStopStreaming?: () => void;
  placeholder?: string;
  className?: string;
}

export function Composer({
  onSendMessage,
  onAttachFile,
  onAttachUrl,
  isStreaming = false,
  onStopStreaming,
  placeholder = "Ask your second brain anything...",
  className
}: ComposerProps) {
  const [message, setMessage] = useState('');
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const slashCommands = [
    { command: '/summarize', description: 'Summarize content or documents' },
    { command: '/compare', description: 'Compare multiple documents or items' },
    { command: '/outline', description: 'Create an outline from content' },
    { command: '/find', description: 'Search for specific information' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isStreaming) {
      onSendMessage(message.trim());
      setMessage('');
      setShowSlashCommands(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    
    if (e.key === 'Escape') {
      setShowSlashCommands(false);
      if (isStreaming && onStopStreaming) {
        onStopStreaming();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Show slash commands when user types /
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastSlash = textBeforeCursor.lastIndexOf('/');
    
    if (lastSlash !== -1 && lastSlash === textBeforeCursor.length - 1) {
      setShowSlashCommands(true);
    } else {
      setShowSlashCommands(false);
    }
  };

  const insertSlashCommand = (command: string) => {
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = message.slice(0, cursorPosition);
    const textAfterCursor = message.slice(cursorPosition);
    const lastSlash = textBeforeCursor.lastIndexOf('/');
    
    if (lastSlash !== -1) {
      const newMessage = 
        textBeforeCursor.slice(0, lastSlash) + 
        command + ' ' + 
        textAfterCursor;
      setMessage(newMessage);
    }
    
    setShowSlashCommands(false);
    textareaRef.current?.focus();
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className={cn("sticky bottom-0 bg-background border-t", className)}>
      <div className="max-w-3xl mx-auto p-4">
        {/* Slash Commands Dropdown */}
        {showSlashCommands && (
          <div className="mb-2 bg-popover border rounded-lg shadow-lg p-2 space-y-1">
            {slashCommands.map((cmd) => (
              <Button
                key={cmd.command}
                variant="ghost"
                className="w-full justify-start text-left h-auto p-2"
                onClick={() => insertSlashCommand(cmd.command)}
              >
                <div>
                  <div className="font-mono text-sm font-medium">{cmd.command}</div>
                  <div className="text-xs text-muted-foreground">{cmd.description}</div>
                </div>
              </Button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-3 p-4 bg-card border rounded-2xl shadow-sm">
            {/* Attach Actions */}
            <div className="flex gap-1 pb-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onAttachFile}
                className="h-8 w-8 p-0"
              >
                <Paperclip size={16} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onAttachUrl}
                className="h-8 w-8 p-0"
              >
                <Sparkles size={16} />
              </Button>
            </div>

            {/* Message Input */}
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="min-h-[44px] max-h-[200px] resize-none border-0 shadow-none focus-visible:ring-0 p-0"
                rows={1}
              />
            </div>

            {/* Send/Stop Button */}
            <div className="pb-2">
              {isStreaming ? (
                <Button
                  type="button"
                  onClick={onStopStreaming}
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0"
                >
                  <Square size={16} />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!message.trim()}
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Send size={16} />
                </Button>
              )}
            </div>
          </div>

          {/* Helper Text */}
          <div className="flex justify-center mt-2">
            <p className="text-xs text-muted-foreground">
              <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send • 
              <kbd className="px-1 py-0.5 bg-muted rounded text-xs mx-1">Shift</kbd>+
              <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> for new line • 
              <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">/</kbd> for commands
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}