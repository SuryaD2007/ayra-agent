import React, { useEffect, useRef } from 'react';
import { User, Bot, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  sources?: Array<{
    id: string;
    title: string;
    domain: string;
    favicon?: string;
  }>;
  isStreaming?: boolean;
}

interface MessageListProps {
  messages: Message[];
  onSourceClick?: (messageId: string, sourceId: string) => void;
  className?: string;
}

const MessageBubble: React.FC<{
  message: Message;
  onSourceClick?: (messageId: string, sourceId: string) => void;
}> = ({ message, onSourceClick }) => {
  const { toast } = useToast();
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Message copied successfully",
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={cn(
      "group flex gap-4 max-w-4xl mx-auto",
      message.sender === 'user' ? "justify-end" : "justify-start"
    )}>
      {/* Avatar */}
      {message.sender === 'ai' && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}
      
      {/* Message Content */}
      <div className={cn(
        "max-w-[80%] space-y-2",
        message.sender === 'user' ? "flex flex-col items-end" : ""
      )}>
        <div className={cn(
          "rounded-xl px-4 py-3 relative",
          message.sender === 'user' 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted/50 border border-border/50"
        )}>
          {/* Copy Button */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
              "bg-background border border-border/50 shadow-sm hover:bg-accent"
            )}
            onClick={() => copyToClipboard(message.content)}
          >
            <Copy className="w-3 h-3" />
          </Button>
          
          {/* Message Text */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {message.content.split('\n').map((line, index) => (
              <p key={index} className={cn(
                "leading-relaxed",
                index === 0 ? "mt-0" : "",
                message.sender === 'user' ? "text-primary-foreground" : ""
              )}>
                {line}
              </p>
            ))}
          </div>
          
          {/* Streaming Indicator */}
          {message.isStreaming && (
            <div className="flex items-center gap-1 mt-2 text-muted-foreground">
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          )}
        </div>
        
        {/* Footer with timestamp and sources */}
        <div className="flex items-center justify-between gap-2 px-2">
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false
            })}
          </span>
          
          {/* Source Pills */}
          {message.sources && message.sources.length > 0 && (
            <div className="flex gap-1">
              {message.sources.map((source) => (
                <Button
                  key={source.id}
                  variant="ghost"
                  size="sm"
                  className="h-5 px-2 text-xs hover:bg-accent"
                  onClick={() => onSourceClick?.(message.id, source.id)}
                >
                  {source.favicon && (
                    <img 
                      src={source.favicon} 
                      alt="" 
                      className="w-3 h-3 mr-1" 
                    />
                  )}
                  {source.domain}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* User Avatar */}
      {message.sender === 'user' && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
};

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onSourceClick,
  className
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  if (messages.length === 0) {
    return (
      <div className={cn("flex-1 flex items-center justify-center", className)}>
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2 text-foreground">
            Search Your Second Brain
          </h2>
          <p className="text-muted-foreground">
            Ask questions to search across your notes, documents, and knowledge base.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn("flex-1 overflow-y-auto", className)}>
      <div className="space-y-6 p-6 pb-20">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onSourceClick={onSourceClick}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};