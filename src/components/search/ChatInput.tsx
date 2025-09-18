import React, { useRef, useEffect, useState } from 'react';
import { Send, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FileAttachment, AttachedFile } from './FileAttachment';

interface ChatInputProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSubmit: (e: React.FormEvent, attachedFiles?: AttachedFile[]) => void;
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  searchQuery,
  setSearchQuery,
  handleSubmit,
  isFocused,
  setIsFocused,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e, attachedFiles);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(e, attachedFiles);
  };

  const handleFilesAdded = (newFiles: AttachedFile[]) => {
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileRemoved = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Clear attachments after successful send
  useEffect(() => {
    if (!searchQuery && attachedFiles.length > 0) {
      // This will clear files when the input is cleared (after sending)
      const timer = setTimeout(() => {
        setAttachedFiles([]);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, attachedFiles.length]);

  return (
    <div className="p-4 border-t border-border/20 bg-gradient-to-t from-background/95 to-background/80 backdrop-blur-xl">
      <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto">
        <div 
          className={cn(
            "relative flex flex-col gap-2 p-3 rounded-2xl border transition-all duration-300 ease-out",
            isFocused 
              ? "border-primary/40 bg-background/90 shadow-lg shadow-primary/10 ring-1 ring-primary/20" 
              : "border-border/40 bg-background/60 hover:border-border/60 hover:bg-background/80"
          )}
        >
          {/* File Attachments */}
          <FileAttachment
            onFilesAdded={handleFilesAdded}
            onFileRemoved={handleFileRemoved}
            attachedFiles={attachedFiles}
            disabled={false}
          />
          
          {/* Input Area */}
          <div className="flex items-end gap-3">
            <Search 
              size={20}
              className={cn(
                "transition-all duration-300 ease-out mt-3 flex-shrink-0",
                isFocused || searchQuery 
                  ? "text-primary scale-110" 
                  : "text-muted-foreground"
              )}
            />
            
            <textarea
              ref={textareaRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="flex-1 bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground min-h-[24px] max-h-[120px] py-2 leading-6"
              rows={1}
            />
            
            <Button
              type="submit"
              size="sm"
              disabled={!searchQuery.trim() && attachedFiles.length === 0}
              className={cn(
                "flex-shrink-0 h-8 w-8 p-0 rounded-xl transition-all duration-300 ease-out",
                searchQuery.trim() || attachedFiles.length > 0
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg scale-100" 
                  : "bg-muted text-muted-foreground scale-95 cursor-not-allowed"
              )}
            >
              <Send size={16} className={searchQuery.trim() || attachedFiles.length > 0 ? "animate-pulse" : ""} />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;