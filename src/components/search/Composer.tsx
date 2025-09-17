import React, { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ComposerProps {
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function Composer({ 
  onSendMessage, 
  isLoading = false, 
  disabled = false,
  placeholder = "Ask your second brain anything..."
}: ComposerProps) {
  const [message, setMessage] = useState('');
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const slashCommands = [
    { command: '/summarize', description: 'Summarize content or documents' },
    { command: '/compare', description: 'Compare different items or topics' },
    { command: '/outline', description: 'Create an outline or structure' },
    { command: '/find', description: 'Search for specific information' },
    { command: '/explain', description: 'Explain a concept or topic' },
    { command: '/analyze', description: 'Analyze data or patterns' }
  ];

  const savedPrompts = [
    "Summarize my recent meeting notes",
    "What are the key insights from my research?",
    "Compare the pros and cons of...",
    "Create an action plan for...",
    "Find information about..."
  ];

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      setShowSlashCommands(false);
    }
  }, [message, isLoading, disabled, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setShowSlashCommands(false);
    }
  }, [handleSubmit]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Show slash commands when typing "/"
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastWord = textBeforeCursor.split(/\s/).pop() || '';
    
    setShowSlashCommands(lastWord.startsWith('/') && lastWord.length > 0);
  }, []);

  const insertSlashCommand = useCallback((command: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = message.substring(0, cursorPosition);
    const textAfterCursor = message.substring(cursorPosition);
    
    // Find the last "/" to replace
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      const newMessage = textBeforeCursor.substring(0, lastSlashIndex) + command + ' ' + textAfterCursor;
      setMessage(newMessage);
      setShowSlashCommands(false);
      
      // Focus and set cursor position
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = lastSlashIndex + command.length + 1;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  }, [message]);

  const insertSavedPrompt = useCallback((prompt: string) => {
    setMessage(prompt);
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  }, []);

  React.useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  return (
    <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-border/50 p-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="bg-card border border-border rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <div className="flex items-end gap-3 p-4">
              {/* Left actions */}
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                >
                  <Paperclip size={16} />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      size="icon" 
                      variant="ghost"
                      className="h-8 w-8"
                    >
                      <Zap size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    <div className="p-2">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Saved Prompts</div>
                      {savedPrompts.map((prompt, index) => (
                        <DropdownMenuItem
                          key={index}
                          onClick={() => insertSavedPrompt(prompt)}
                          className="text-sm"
                        >
                          {prompt}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Message input */}
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  disabled={disabled || isLoading}
                  className="min-h-[40px] max-h-[150px] resize-none border-0 shadow-none focus-visible:ring-0 p-0 text-base"
                  rows={1}
                />
                
                {/* Slash commands dropdown */}
                {showSlashCommands && (
                  <div className="absolute bottom-full left-0 mb-2 w-72 bg-popover border border-border rounded-lg shadow-lg z-50">
                    <div className="p-2">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Commands</div>
                      {slashCommands
                        .filter(cmd => cmd.command.toLowerCase().includes(message.toLowerCase().split('/').pop() || ''))
                        .map((cmd) => (
                        <div
                          key={cmd.command}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => insertSlashCommand(cmd.command)}
                        >
                          <div className="text-primary font-mono text-sm mt-0.5">{cmd.command}</div>
                          <div className="text-sm text-muted-foreground">{cmd.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Send button */}
              <Button
                type="submit"
                size="icon"
                disabled={!message.trim() || isLoading || disabled}
                className={cn(
                  "h-8 w-8 transition-all",
                  message.trim() && !isLoading ? "bg-primary hover:bg-primary/90" : ""
                )}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Helper text */}
        <div className="text-center mt-3">
          <p className="text-xs text-muted-foreground">
            <kbd className="px-2 py-1 text-xs bg-muted rounded">Enter</kbd> to send • {' '}
            <kbd className="px-2 py-1 text-xs bg-muted rounded">Shift + Enter</kbd> for new line • {' '}
            Type <kbd className="px-2 py-1 text-xs bg-muted rounded">/</kbd> for commands
          </p>
        </div>
      </div>
    </div>
  );
}