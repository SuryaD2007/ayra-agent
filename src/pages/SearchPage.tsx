import React, { useState } from 'react';
import { Brain, Search, Upload, User, Settings, Moon, Sun, Share, Grid3X3, ChevronDown, PlusCircle, Edit3, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
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

interface SuggestedResult {
  id: string;
  title: string;
  description: string;
}

const SearchPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [chats, setChats] = useState<Chat[]>([
    {
      id: '1',
      title: 'n',
      messages: [
        {
          id: '1',
          content: 'n',
          sender: 'user',
          timestamp: new Date('2024-09-16T21:28:00')
        },
        {
          id: '2',
          content: 'Based on your search for "n", I found several relevant notes in your second brain. Would you like me to summarize the key insights?',
          sender: 'ai',
          timestamp: new Date('2024-09-16T21:28:10')
        }
      ],
      createdAt: new Date('2024-09-16T21:28:00')
    }
  ]);
  const [activeChat, setActiveChat] = useState<Chat | null>(chats[0]);
  const [messages, setMessages] = useState<Message[]>(chats[0]?.messages || []);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  const suggestedResults: SuggestedResult[] = [
    {
      id: '1',
      title: 'Artificial Intelligence',
      description: 'Related to your search query'
    },
    {
      id: '2', 
      title: 'Machine Learning',
      description: 'Related to your search query'
    },
    {
      id: '3',
      title: 'Neural Networks', 
      description: 'Related to your search query'
    }
  ];

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
        content: `Based on your search for "${content}", I found several relevant notes in your second brain. Would you like me to summarize the key insights?`,
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
    }, 800);
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
      <div className="h-screen flex flex-col">
        {/* Top Navigation */}
        <div className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-6 py-3">
            {/* Left side - Cortex dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 text-base font-medium">
                  <Brain size={20} />
                  Cortex
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>Overview</DropdownMenuItem>
                <DropdownMenuItem>Analytics</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost">
                <Grid3X3 size={20} />
              </Button>
              <Button size="icon" variant="ghost">
                <Search size={20} />
              </Button>
              <Button size="icon" variant="ghost">
                <Upload size={20} />
              </Button>
              
              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button size="icon" variant="ghost">
                <Settings size={20} />
              </Button>
              <Button size="icon" variant="ghost" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </Button>
              <Button size="icon" variant="ghost">
                <Share size={20} />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-64 border-r border-border/50 bg-muted/20 flex flex-col">
            {/* New Chat Button */}
            <div className="p-4">
              <Button 
                onClick={createNewChat}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <PlusCircle size={16} />
                New Chat
              </Button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-4">
              {chats.length > 0 && (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Today</h3>
                  {chats.map(chat => (
                    <div 
                      key={chat.id}
                      onClick={() => handleChatSelect(chat)}
                      className={cn(
                        "p-2 rounded-lg flex items-center gap-2 cursor-pointer group",
                        activeChat?.id === chat.id 
                          ? "bg-muted" 
                          : "hover:bg-muted/50"
                      )}
                    >
                      <Search size={14} className="text-muted-foreground" />
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
                              className="h-6 text-sm"
                            />
                          </form>
                        ) : (
                          <p className="text-sm truncate">{chat.title}</p>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6" 
                          onClick={(e) => startEditingTitle(chat.id, e)}
                        >
                          <Edit3 size={12} />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6" 
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
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <h2 className="text-2xl font-semibold">Search Your Second Brain</h2>
                    <p className="text-muted-foreground">
                      Ask questions to search across your notes, documents, and knowledge base.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 max-w-4xl">
                  {messages.map((message, index) => (
                    <div key={message.id} className="space-y-4">
                      {/* User message */}
                      {message.sender === 'user' && (
                        <div className="flex justify-end">
                          <div className="bg-muted/60 rounded-2xl px-4 py-3 max-w-md">
                            <div className="flex items-center gap-3 mb-1">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{message.content}</span>
                            </div>
                            <div className="text-xs text-muted-foreground text-right">
                              {message.timestamp.toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AI response */}
                      {message.sender === 'ai' && (
                        <div className="space-y-4">
                          <div className="text-sm leading-relaxed">
                            <div className="text-sm text-muted-foreground mb-1">
                              {message.timestamp.toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit'
                              })}
                            </div>
                            {message.content}
                          </div>
                          
                          {/* Suggested Results - only show for the last AI message */}
                          {index === messages.length - 1 && (
                            <div className="space-y-4">
                              <h3 className="text-sm font-medium text-muted-foreground">Suggested Results</h3>
                              <div className="space-y-3">
                                {suggestedResults.map((result) => (
                                  <div
                                    key={result.id}
                                    className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                                  >
                                    <h4 className="font-medium mb-1">{result.title}</h4>
                                    <p className="text-sm text-muted-foreground">{result.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Input */}
            <div className="p-6 border-t border-border/50">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(chatInput);
                }}
                className="relative"
              >
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask your second brain anything..."
                    className="pl-12 pr-12 py-6 text-base rounded-full border-border/50"
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    variant="ghost"
                    disabled={!chatInput.trim()}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <AuthModal 
          isOpen={authModalOpen} 
          onClose={() => setAuthModalOpen(false)} 
        />
      </div>
    </AuthGuard>
  );
};

export default SearchPage;