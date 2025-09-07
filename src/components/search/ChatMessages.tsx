import React from 'react';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatMessagesProps {
  messages: Message[];
  showSuggestions?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
}

const SuggestedResults: React.FC<{ onSuggestionClick?: (suggestion: string) => void }> = ({ 
  onSuggestionClick 
}) => {
  const suggestions = [
    { title: "Artificial Intelligence", subtitle: "Related to your search query" },
    { title: "Machine Learning", subtitle: "Related to your search query" },
    { title: "Neural Networks", subtitle: "Related to your search query" }
  ];

  return (
    <div className="glass-panel rounded-xl p-4 mb-4">
      <h4 className="text-sm font-medium text-muted-foreground mb-3">
        Suggested Results
      </h4>
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="p-3 rounded-lg hover:bg-primary/5 cursor-pointer transition-colors"
            onClick={() => onSuggestionClick?.(suggestion.title)}
          >
            <div className="font-medium text-sm">{suggestion.title}</div>
            <div className="text-xs text-muted-foreground">{suggestion.subtitle}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChatMessages: React.FC<ChatMessagesProps> = ({ 
  messages, 
  showSuggestions = false,
  onSuggestionClick 
}) => {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center animate-fade-in">
          <h2 className="text-xl font-medium mb-2">Search Your Second Brain</h2>
          <p className="text-muted-foreground max-w-md">
            Ask questions to search across your notes, documents, and knowledge base.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((message, index) => (
        <div key={message.id} className="animate-fade-in">
          <div className={cn(
            "flex gap-3 max-w-[80%]",
            message.sender === 'user' ? "ml-auto flex-row-reverse" : ""
          )}>
            {/* Avatar */}
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              message.sender === 'user' 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted"
            )}>
              {message.sender === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            {/* Message Content */}
            <div className={cn(
              "rounded-2xl px-4 py-3",
              message.sender === 'user' 
                ? "bg-primary/10" 
                : "bg-muted/10"
            )}>
              <p className="text-sm leading-relaxed">{message.content}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {message.timestamp.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false
                })}
              </p>
            </div>
          </div>

          {/* Show suggestions after AI messages */}
          {message.sender === 'ai' && 
           showSuggestions && 
           index === messages.length - 1 && (
            <div className="mt-4">
              <SuggestedResults onSuggestionClick={onSuggestionClick} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};