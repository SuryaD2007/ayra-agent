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
      <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-background/95">
        {/* Top Navigation */}
        <div className="border-b border-border/30 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-8 py-4">
            {/* Left side - Cortex dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-3 text-lg font-semibold hover:bg-muted/50 transition-all duration-200 hover:scale-105">
                  <Brain size={22} className="text-primary" />
                  Cortex
                  <ChevronDown size={16} className="text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="glass-panel">
                <DropdownMenuItem className="hover:bg-primary/10">Overview</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-primary/10">Analytics</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-primary/10">Settings</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Right side - Actions */}
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="hover:bg-muted/50 transition-all duration-200 hover:scale-110">
                <Grid3X3 size={20} />
              </Button>
              <Button size="icon" variant="ghost" className="hover:bg-muted/50 transition-all duration-200 hover:scale-110">
                <Search size={20} />
              </Button>
              <Button size="icon" variant="ghost" className="hover:bg-muted/50 transition-all duration-200 hover:scale-110">
                <Upload size={20} />
              </Button>
              
              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="hover:bg-muted/50 transition-all duration-200 hover:scale-110">
                    <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-panel">
                  <DropdownMenuItem className="hover:bg-primary/10">Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="hover:bg-destructive/10">Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button size="icon" variant="ghost" className="hover:bg-muted/50 transition-all duration-200 hover:scale-110">
                <Settings size={20} />
              </Button>
              <Button size="icon" variant="ghost" onClick={toggleTheme} className="hover:bg-muted/50 transition-all duration-200 hover:scale-110">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </Button>
              <Button size="icon" variant="ghost" className="hover:bg-muted/50 transition-all duration-200 hover:scale-110">
                <Share size={20} />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-72 border-r border-border/30 bg-gradient-to-b from-muted/10 to-muted/30 backdrop-blur-sm flex flex-col">
            {/* New Chat Button */}
            <div className="p-6">
              <Button 
                onClick={createNewChat}
                variant="outline"
                className="w-full justify-start gap-3 h-12 text-base font-medium border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-md"
              >
                <PlusCircle size={18} className="text-primary" />
                New Chat
              </Button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {chats.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4 px-3">Today</h3>
                  {chats.map(chat => (
                    <div 
                      key={chat.id}
                      onClick={() => handleChatSelect(chat)}
                      className={cn(
                        "p-3 rounded-xl flex items-center gap-3 cursor-pointer group transition-all duration-300 hover:scale-[1.02]",
                        activeChat?.id === chat.id 
                          ? "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 shadow-sm" 
                          : "hover:bg-muted/40 hover:shadow-sm"
                      )}
                    >
                      <Search size={16} className={cn(
                        "transition-colors duration-200",
                        activeChat?.id === chat.id ? "text-primary" : "text-muted-foreground"
                      )} />
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
                              className="h-7 text-sm border-primary/30 focus:border-primary/50"
                            />
                          </form>
                        ) : (
                          <p className="text-sm font-medium truncate">{chat.title}</p>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 hover:bg-primary/20 transition-all duration-200 hover:scale-110" 
                          onClick={(e) => startEditingTitle(chat.id, e)}
                        >
                          <Edit3 size={12} />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 hover:bg-destructive/20 transition-all duration-200 hover:scale-110" 
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
          <div className="flex-1 flex flex-col bg-gradient-to-br from-background/95 to-background/98">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-6 animate-fade-in">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-3xl rounded-full"></div>
                      <h2 className="relative text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        Search Your Second Brain
                      </h2>
                    </div>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
                      Ask questions to search across your notes, documents, and knowledge base.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 max-w-5xl animate-fade-in">
                  {messages.map((message, index) => (
                    <div key={message.id} className="space-y-6">
                      {/* User message */}
                      {message.sender === 'user' && (
                        <div className="flex justify-end animate-slide-in-right">
                          <div className="glass-panel bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl px-6 py-4 max-w-lg shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-4 mb-2">
                              <Avatar className="h-8 w-8 ring-2 ring-primary/30">
                                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/20 text-primary font-semibold text-sm">
                                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-base font-semibold">{message.content}</span>
                            </div>
                            <div className="text-xs text-muted-foreground text-right font-medium">
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
                        <div className="space-y-6 animate-fade-in">
                          <div className="text-base leading-relaxed">
                            <div className="text-sm text-muted-foreground mb-3 font-medium">
                              {message.timestamp.toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit'
                              })}
                            </div>
                            <div className="prose prose-neutral dark:prose-invert">
                              {message.content}
                            </div>
                          </div>
                          
                          {/* Suggested Results - only show for the last AI message */}
                          {index === messages.length - 1 && (
                            <div className="space-y-5">
                              <h3 className="text-base font-semibold text-muted-foreground">Suggested Results</h3>
                              <div className="grid gap-4">
                                {suggestedResults.map((result, idx) => (
                                  <div
                                    key={result.id}
                                    className="glass-panel p-6 rounded-xl border border-border/50 hover:border-primary/30 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-2">
                                        <h4 className="text-lg font-semibold group-hover:text-primary transition-colors duration-200">{result.title}</h4>
                                        <p className="text-muted-foreground leading-relaxed">{result.description}</p>
                                      </div>
                                      <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors duration-200"></div>
                                    </div>
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
            <div className="p-8 border-t border-border/30 bg-gradient-to-r from-background/80 to-background/90 backdrop-blur-sm">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(chatInput);
                }}
                className="relative max-w-4xl mx-auto"
              >
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" size={22} />
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask your second brain anything..."
                    className="pl-16 pr-16 py-8 text-lg rounded-2xl border-2 border-border/50 hover:border-border focus:border-primary/50 bg-background/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 focus:scale-[1.02]"
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    variant="ghost"
                    disabled={!chatInput.trim()}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-10 w-10 rounded-xl hover:bg-primary/20 hover:scale-110 disabled:opacity-30 transition-all duration-200"
                  >
                    <Send size={18} className={cn(
                      "transition-colors duration-200",
                      chatInput.trim() ? "text-primary" : "text-muted-foreground"
                    )} />
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