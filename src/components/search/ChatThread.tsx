import React, { useState } from 'react';
import { Bot, User, ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Message, SourceCard } from '@/types/chat';
import { SourceCard as SourceCardComponent } from './SourceCard';

interface ChatThreadProps {
  messages: Message[];
  isLoading?: boolean;
  sources?: SourceCard[];
  onSuggestionClick?: (message: string) => void;
}

export function ChatThread({ messages, isLoading = false, sources = [], onSuggestionClick }: ChatThreadProps) {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});

  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    setFeedback(prev => ({
      ...prev,
      [messageId]: prev[messageId] === type ? undefined : type
    } as Record<string, 'up' | 'down'>));
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-2xl mx-auto px-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Bot size={32} className="text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Welcome to Ayra Search</h2>
            <p className="text-muted-foreground">
              Ask questions to search across your notes, documents, and knowledge base.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
            <Button 
              variant="outline" 
              className="justify-start text-left h-auto py-3 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 hover-glide smooth-bounce cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSuggestionClick?.("Summarize my meeting notes");
              }}
            >
              <div className="pointer-events-none">
                <div className="font-medium">Summarize my meeting notes</div>
                <div className="text-sm text-muted-foreground">Get key insights from recent documents</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start text-left h-auto py-3 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 hover-glide smooth-bounce cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSuggestionClick?.("Find research on AI trends");
              }}
            >
              <div className="pointer-events-none">
                <div className="font-medium">Find research on AI trends</div>
                <div className="text-sm text-muted-foreground">Search through saved articles and papers</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start text-left h-auto py-3 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 hover-glide smooth-bounce cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSuggestionClick?.("What are my project goals?");
              }}
            >
              <div className="pointer-events-none">
                <div className="font-medium">What are my project goals?</div>
                <div className="text-sm text-muted-foreground">Review objectives from project docs</div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {messages.map((message, index) => (
          <div key={message.id} className="space-y-4 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
            <div className={cn(
              "flex gap-4",
              message.role === 'user' ? "justify-end" : "justify-start"
            )}>
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={16} className="text-primary-foreground" />
                </div>
              )}
              
              <div className={cn(
                "max-w-[740px] rounded-2xl px-6 py-4 transition-all duration-300 hover-glide",
                message.role === 'user' 
                  ? "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20" 
                  : "bg-muted hover:shadow-md"
              )}>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {message.content.split('\n').map((line, index) => (
                    <p key={index} className="mb-2 last:mb-0 leading-relaxed">
                      {line}
                    </p>
                  ))}
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-2">
                  <div className="text-xs opacity-60">
                    {new Date(message.created_at).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit'
                    })}
                  </div>
                  
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 transition-all duration-300 smooth-bounce hover-glow"
                        onClick={() => copyToClipboard(message.content, message.id)}
                      >
                        {copiedMessageId === message.id ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                          "h-7 w-7 transition-all duration-300 smooth-bounce hover-glow",
                          feedback[message.id] === 'up' && "text-green-500 bg-green-500/10"
                        )}
                        onClick={() => handleFeedback(message.id, 'up')}
                      >
                        <ThumbsUp size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                          "h-7 w-7 transition-all duration-300 smooth-bounce hover-glow",
                          feedback[message.id] === 'down' && "text-red-500 bg-red-500/10"
                        )}
                        onClick={() => handleFeedback(message.id, 'down')}
                      >
                        <ThumbsDown size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <User size={16} className="text-secondary-foreground" />
                </div>
              )}
            </div>

            {/* Sources for assistant messages */}
            {message.role === 'assistant' && sources.length > 0 && (
              <div className="ml-12 space-y-3">
                <div className="text-sm font-medium text-muted-foreground">Sources</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sources.map((source) => (
                    <SourceCardComponent key={source.id} source={source} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 animate-fade-in">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
              <Bot size={16} className="text-primary-foreground" />
            </div>
            <div className="max-w-[740px] bg-muted rounded-2xl px-6 py-4 hover-float">
              <div className="space-y-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
                <div className="text-sm text-muted-foreground">Searching your knowledge base...</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}