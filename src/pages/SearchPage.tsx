import React, { useState, useEffect } from 'react';
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
import { useChatSession } from '@/hooks/useChatSession';
import { ChatThread } from '@/components/search/ChatThread';
import ChatInput from '@/components/search/ChatInput';

interface SuggestedResult {
  id: string;
  title: string;
  description: string;
}

const SearchPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const {
    chats,
    folders,
    activeChat,
    messages,
    isLoading,
    isStreaming,
    createNewChat,
    updateChatTitle,
    deleteChat,
    sendMessage,
    selectChat
  } = useChatSession();
  
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
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

  const handleCreateNewChat = async () => {
    const newChat = await createNewChat();
    if (newChat) {
      setIsEditingTitle(newChat.id);
      setEditTitle(newChat.title);
    }
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteChat(chatId);
  };

  const startEditingTitle = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setIsEditingTitle(chatId);
      setEditTitle(chat.title);
    }
  };

  const saveTitle = async (chatId: string) => {
    if (editTitle.trim()) {
      await updateChatTitle(chatId, editTitle.trim());
    }
    setIsEditingTitle(null);
    setEditTitle('');
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    setChatInput('');
    
    // If no active chat, create one with default title and send message
    if (!activeChat) {
      const newChat = await createNewChat(); // Creates with default "New Chat" title
      if (newChat) {
        await sendMessage(content);
      }
    } else {
      await sendMessage(content);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(chatInput);
  };


  return (
    <AuthGuard 
      title="Search your knowledge"
      description="Sign in to search through your notes, documents, and saved content."
    >
      <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-background/95">
        {/* Top Navigation */}
        <div className="border-b border-border/30 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left side - Ayra dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 text-base font-semibold hover:bg-muted/50 transition-all duration-200 hover:scale-105">
                    <Brain size={18} className="text-primary" />
                    Ayra
                    <ChevronDown size={14} className="text-muted-foreground" />
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
              <Button size="sm" variant="ghost" className="hover:bg-muted/50 transition-all duration-300 smooth-bounce h-8 w-8">
                <Grid3X3 size={16} />
              </Button>
              <Button size="sm" variant="ghost" className="hover:bg-muted/50 transition-all duration-300 smooth-bounce h-8 w-8">
                <Search size={16} />
              </Button>
              <Button size="sm" variant="ghost" className="hover:bg-muted/50 transition-all duration-300 smooth-bounce h-8 w-8">
                <Upload size={16} />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="hover:bg-muted/50 transition-all duration-300 smooth-bounce h-8 w-8">
                    <Avatar className="h-7 w-7 ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/40">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-xs">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-panel">
                  <DropdownMenuItem className="hover:bg-primary/10 transition-all duration-200">Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="hover:bg-destructive/10 transition-all duration-200">Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button size="sm" variant="ghost" className="hover:bg-muted/50 transition-all duration-300 smooth-bounce h-8 w-8">
                <Settings size={16} />
              </Button>
              <Button size="sm" variant="ghost" onClick={toggleTheme} className="hover:bg-muted/50 transition-all duration-300 smooth-bounce h-8 w-8">
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </Button>
              <Button size="sm" variant="ghost" className="hover:bg-muted/50 transition-all duration-300 smooth-bounce h-8 w-8">
                <Share size={16} />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-64 border-r border-border/30 bg-gradient-to-b from-muted/10 to-muted/30 backdrop-blur-sm flex flex-col">
            {/* New Chat Button */}
            <div className="p-4">
              <Button 
                onClick={handleCreateNewChat}
                variant="outline"
                className="w-full justify-start gap-2 h-9 text-sm font-medium border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 hover-glide smooth-bounce shadow-sm"
              >
                <PlusCircle size={16} className="text-primary" />
                New Chat
              </Button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-3 pb-3">
              {chats.length > 0 && (
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-2">Today</h3>
                  {chats.map(chat => (
                    <div 
                      key={chat.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        selectChat(chat);
                      }}
                      className={cn(
                        "p-3 rounded-lg flex items-center gap-3 cursor-pointer group transition-all duration-300 hover-glide hover-slide",
                        activeChat?.id === chat.id 
                          ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                          : "hover:bg-muted/50 text-muted-foreground hover:text-foreground hover:shadow-md"
                      )}
                    >
                      <Search size={16} className={cn(
                        "transition-colors duration-200 flex-shrink-0",
                        activeChat?.id === chat.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      <div className="flex-1 min-w-0">
                        {isEditingTitle === chat.id ? (
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
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
                            <p className="text-sm font-medium truncate leading-5">{chat.title}</p>
                          )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 hover:bg-primary/20 transition-all duration-300 smooth-bounce hover-glow" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            startEditingTitle(chat.id, e);
                          }}
                        >
                          <Edit3 size={12} />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 hover:bg-destructive/20 transition-all duration-300 smooth-bounce hover-glow" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteChat(chat.id, e);
                          }}
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
            <ChatThread 
              messages={messages} 
              isLoading={isStreaming} 
              onSuggestionClick={handleSendMessage}
            />
            <ChatInput
              searchQuery={chatInput}
              setSearchQuery={setChatInput}
              handleSubmit={handleSubmit}
              isFocused={isFocused}
              setIsFocused={setIsFocused}
            />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default SearchPage;