import React, { useState } from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, MessageSquare, Edit3, Trash2, User, Bot, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import AuthGuard from '@/components/auth/AuthGuard';
import InlineError from '@/components/auth/InlineError';
import AuthModal from '@/components/AuthModal';
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

const SearchPage = () => {
  const showContent = useAnimateIn(false, 300);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date()
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChat);
    setMessages([]);
    setIsEditingTitle(newChat.id);
    setEditTitle(newChat.title);
  };

  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (activeChat?.id === chatId) {
      setActiveChat(null);
      setMessages([]);
    }
  };

  const startEditingTitle = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setIsEditingTitle(chatId);
      setEditTitle(chat.title);
    }
  };

  const saveTitle = (chatId: string) => {
    if (editTitle.trim()) {
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: editTitle.trim() } : chat
      ));
      if (activeChat?.id === chatId) {
        setActiveChat(prev => prev ? { ...prev, title: editTitle.trim() } : null);
      }
    }
    setIsEditingTitle(null);
    setEditTitle('');
  };

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };
    
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setChatInput('');
    
    // Update active chat
    if (activeChat) {
      const updatedChat = { ...activeChat, messages: updatedMessages };
      setActiveChat(updatedChat);
      setChats(prev => prev.map(chat => 
        chat.id === activeChat.id ? updatedChat : chat
      ));
    }
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `I can help you search through your knowledge base. What would you like to find?`,
        sender: 'ai',
        timestamp: new Date(),
      };
      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);
      
      if (activeChat) {
        const finalChat = { ...activeChat, messages: finalMessages };
        setActiveChat(finalChat);
        setChats(prev => prev.map(chat => 
          chat.id === activeChat.id ? finalChat : chat
        ));
      }
    }, 1000);
  };

  const handleChatSelect = (chat: Chat) => {
    setActiveChat(chat);
    setMessages(chat.messages);
  };

  return (
    <AuthGuard 
      title="Search your knowledge"
      description="Sign in to search through your notes, documents, and saved content."
    >
      <div className="flex h-screen">
        {authError && (
          <div className="absolute top-4 left-4 right-4 z-50">
            <InlineError 
              message={authError}
              onSignIn={() => setAuthModalOpen(true)}
            />
          </div>
        )}
        
        <AnimatedTransition show={showContent} animation="slide-up" className="flex w-full">
          {/* Left Sidebar */}
          <div className="w-64 border-r border-border/50 bg-muted/30 flex flex-col">
            {/* New Chat Button */}
            <div className="p-3 border-b border-border/50">
              <Button 
                onClick={createNewChat}
                className="w-full justify-start gap-2"
                variant="outline"
              >
                <PlusCircle size={16} />
                New Chat
              </Button>
            </div>
            
            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {chats.length > 0 && (
                <div className="p-2">
                  <h3 className="text-xs font-medium text-muted-foreground px-2 mb-2">Today</h3>
                  {chats.map(chat => (
                    <div 
                      key={chat.id}
                      onClick={() => handleChatSelect(chat)}
                      className={cn(
                        "p-3 rounded-lg flex items-center gap-2 cursor-pointer group mb-1",
                        activeChat?.id === chat.id 
                          ? "bg-primary/10 text-primary border-l-2 border-primary" 
                          : "hover:bg-muted/50"
                      )}
                    >
                      <MessageSquare size={16} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {isEditingTitle === chat.id ? (
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              saveTitle(chat.id);
                            }}
                          >
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              autoFocus
                              onBlur={() => saveTitle(chat.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-6 py-0 text-sm"
                            />
                          </form>
                        ) : (
                          <p className="text-sm truncate">{chat.title}</p>
                        )}
                      </div>
                      <div className={cn(
                        "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                        activeChat?.id === chat.id ? "opacity-100" : ""
                      )}>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7" 
                          onClick={(e) => startEditingTitle(chat.id, e)}
                        >
                          <Edit3 size={12} />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7" 
                          onClick={(e) => deleteChat(chat.id, e)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-2 max-w-md">
                    <h2 className="text-2xl font-semibold">Search Your Second Brain</h2>
                    <p className="text-muted-foreground">
                      Ask questions to search across your notes, documents, and knowledge base.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto p-6 space-y-6">
                  {messages.map((message) => (
                    <div 
                      key={message.id}
                      className={cn(
                        "flex gap-4",
                        message.sender === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.sender === 'ai' && (
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot size={16} className="text-primary" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[80%] p-4 rounded-xl",
                        message.sender === 'user' 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      )}>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {message.sender === 'user' && (
                        <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <User size={16} className="text-secondary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Chat Input */}
            <div className="border-t border-border/50 p-4">
              <div className="max-w-3xl mx-auto">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(chatInput);
                  }}
                  className="flex gap-3 items-end"
                >
                  <div className="flex-1 relative">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask your second brain anything..."
                      className="pr-12 py-3 text-base resize-none"
                    />
                    <Button 
                      type="submit" 
                      size="icon"
                      disabled={!chatInput.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    >
                      <Send size={16} />
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </AnimatedTransition>

        <AuthModal 
          isOpen={authModalOpen} 
          onClose={() => setAuthModalOpen(false)} 
        />
      </div>
    </AuthGuard>
  );
};

export default SearchPage;