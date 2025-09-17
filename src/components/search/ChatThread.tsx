import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  Bot, 
  User,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage, StreamingState } from '@/types/chat';
import { formatDate } from '@/utils/chatUtils';

interface Source {
  title: string;
  domain: string;
  url: string;
  favicon?: string;
}

interface ChatThreadProps {
  messages: ChatMessage[];
  streamingState: StreamingState;
  onRegenerateResponse?: (messageId: string) => void;
  onFeedback?: (messageId: string, type: 'up' | 'down') => void;
  className?: string;
}

export function ChatThread({
  messages,
  streamingState,
  onRegenerateResponse,
  onFeedback,
  className
}: ChatThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderMessageContent = (content: string) => {
    // Simple markdown-like rendering for code blocks
    const parts = content.split(/(```[\s\S]*?```)/);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3).trim();
        const lines = code.split('\n');
        const language = lines[0].includes(' ') ? '' : lines[0];
        const codeContent = language ? lines.slice(1).join('\n') : code;
        
        return (
          <div key={index} className="my-3 bg-muted rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-muted border-b">
              <span className="text-xs font-mono text-muted-foreground">
                {language || 'code'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(codeContent)}
                className="h-6 px-2 text-xs"
              >
                <Copy size={12} className="mr-1" />
                Copy
              </Button>
            </div>
            <pre className="p-3 text-sm overflow-x-auto">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      }
      
      return <span key={index}>{part}</span>;
    });
  };

  const renderSources = (sources: Source[]) => {
    if (!sources || sources.length === 0) return null;
    
    return (
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Sources</h4>
        <div className="flex flex-wrap gap-2">
          {sources.map((source, index) => (
            <a
              key={index}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 bg-muted/50 border rounded-lg hover:bg-muted transition-colors text-sm"
            >
              {source.favicon ? (
                <img 
                  src={source.favicon} 
                  alt={source.domain}
                  className="w-4 h-4 rounded"
                />
              ) : (
                <div className="w-4 h-4 bg-primary/10 rounded flex items-center justify-center">
                  <ExternalLink size={10} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{source.title}</div>
                <div className="text-muted-foreground text-xs">{source.domain}</div>
              </div>
              <ExternalLink size={12} className="text-muted-foreground" />
            </a>
          ))}
        </div>
      </div>
    );
  };

  if (messages.length === 0) {
    return (
      <div className={cn("flex-1 flex items-center justify-center", className)}>
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Bot size={32} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-2">Search Your Second Brain</h2>
            <p className="text-muted-foreground">
              Ask questions to search across your notes, documents, and knowledge base.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="outline" className="mr-2">Summarize recent notes</Badge>
            <Badge variant="outline" className="mr-2">Find research on AI</Badge>
            <Badge variant="outline">Compare documents</Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex-1 overflow-y-auto", className)}>
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        {messages.map((message, index) => {
          const isUser = message.role === 'user';
          const isLastAssistantMessage = 
            !isUser && 
            index === messages.length - 1 && 
            !streamingState.isStreaming;
          
          return (
            <div key={message.id} className={cn("flex gap-4", isUser && "flex-row-reverse")}>
              {/* Avatar */}
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className={cn(
                  "text-sm font-medium",
                  isUser ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary-foreground"
                )}>
                  {isUser ? <User size={16} /> : <Bot size={16} />}
                </AvatarFallback>
              </Avatar>
              
              {/* Message Content */}
              <div className={cn("flex-1 space-y-2", isUser && "text-right")}>
                <div className={cn(
                  "inline-block p-4 rounded-2xl max-w-[85%]",
                  isUser 
                    ? "bg-primary text-primary-foreground ml-auto" 
                    : "bg-muted"
                )}>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {renderMessageContent(message.content)}
                  </div>
                </div>
                
                {/* Message metadata and actions */}
                <div className={cn(
                  "flex items-center gap-2 text-xs text-muted-foreground",
                  isUser && "justify-end"
                )}>
                  <span>{formatDate(new Date(message.created_at))}</span>
                  
                  {!isUser && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(message.content)}
                        className="h-6 px-2"
                      >
                        <Copy size={12} />
                      </Button>
                      
                      {onFeedback && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onFeedback(message.id, 'up')}
                            className="h-6 px-2"
                          >
                            <ThumbsUp size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onFeedback(message.id, 'down')}
                            className="h-6 px-2"
                          >
                            <ThumbsDown size={12} />
                          </Button>
                        </>
                      )}
                      
                      {isLastAssistantMessage && onRegenerateResponse && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRegenerateResponse(message.id)}
                          className="h-6 px-2"
                        >
                          <RefreshCw size={12} />
                          Regenerate
                        </Button>
                      )}
                    </>
                  )}
                </div>
                
                {/* Sources (for assistant messages only) */}
                {!isUser && renderSources([])}
              </div>
            </div>
          );
        })}
        
        {/* Streaming indicator */}
        {streamingState.isStreaming && (
          <div className="flex gap-4">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-secondary/10 text-secondary-foreground">
                <Bot size={16} />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="inline-block p-4 rounded-2xl bg-muted">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}