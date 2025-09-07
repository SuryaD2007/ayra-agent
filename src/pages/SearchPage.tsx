import React, { useState } from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Grid, List, Calendar, Tag, FileText, Link, Image, File, Plus, MessageSquare, Edit, Trash2, Send } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import AuthGuard from '@/components/auth/AuthGuard';
import InlineError from '@/components/auth/InlineError';
import AuthModal from '@/components/AuthModal';
import { AuthError } from '@/lib/data';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

const SearchPage = () => {
  const showContent = useAnimateIn(false, 300);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  // Chat sessions management
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: '1',
      title: 'New Chat',
      messages: [],
      createdAt: new Date()
    }
  ]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('1');
  
  const currentSession = chatSessions.find(session => session.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // Mock data for demonstration
  const searchResults = [
    {
      id: '1',
      title: 'Machine Learning Fundamentals',
      type: 'PDF',
      preview: 'Introduction to machine learning concepts including supervised and unsupervised learning...',
      tags: ['AI', 'Machine Learning', 'Data Science'],
      date: '2024-01-15',
      space: 'Work'
    },
    {
      id: '2',
      title: 'React Best Practices',
      type: 'Link',
      preview: 'A comprehensive guide to React development best practices and patterns...',
      tags: ['React', 'JavaScript', 'Frontend'],
      date: '2024-01-20',
      space: 'Personal'
    },
    {
      id: '3',
      title: 'Design System Notes',
      type: 'Note',
      preview: 'Notes on building a comprehensive design system with reusable components...',
      tags: ['Design', 'UI/UX', 'System'],
      date: '2024-01-25',
      space: 'Work'
    }
  ];

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };
    
    // Update current session with new message
    setChatSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? { 
            ...session, 
            messages: [...session.messages, newMessage],
            title: session.messages.length === 0 ? content.slice(0, 30) + '...' : session.title
          }
        : session
    ));
    
    setChatInput('');
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `I found ${searchResults.length} items related to "${content}". Here are the most relevant results...`,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setChatSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages: [...session.messages, aiResponse] }
          : session
      ));
    }, 1000);
  };

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date()
    };
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const deleteChat = (sessionId: string) => {
    setChatSessions(prev => {
      const filtered = prev.filter(session => session.id !== sessionId);
      if (currentSessionId === sessionId && filtered.length > 0) {
        setCurrentSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const filteredResults = searchResults.filter(result => {
    if (searchQuery && !result.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !result.preview.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (selectedType !== 'all' && result.type.toLowerCase() !== selectedType.toLowerCase()) {
      return false;
    }
    
    if (selectedTags.length > 0 && !selectedTags.some(tag => result.tags.includes(tag))) {
      return false;
    }
    
    return true;
  });

  return (
    <AuthGuard 
      title="Search your knowledge"
      description="Sign in to search through your notes, documents, and saved content."
    >
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          {/* Chat History Sidebar */}
          <Sidebar className="w-64 border-r">
            <SidebarContent>
              <div className="p-4 border-b">
                <Button 
                  onClick={createNewChat}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Chat
                </Button>
              </div>
              
              <SidebarGroup>
                <SidebarGroupLabel>Today</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {chatSessions.map((session) => (
                      <SidebarMenuItem key={session.id}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={currentSessionId === session.id}
                        >
                          <div 
                            className="flex items-center justify-between w-full cursor-pointer group"
                            onClick={() => setCurrentSessionId(session.id)}
                          >
                            <div className="flex items-center min-w-0 flex-1">
                              <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
                              <span className="truncate text-sm">
                                {session.title}
                              </span>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Edit functionality could be added here
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteChat(session.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <header className="h-16 flex items-center border-b px-6">
              <SidebarTrigger className="mr-4" />
              <h1 className="text-xl font-semibold">New Chat</h1>
            </header>
            
            {authError && (
              <div className="mb-4 mx-4">
                <InlineError 
                  message={authError}
                  onSignIn={() => setAuthModalOpen(true)}
                />
              </div>
            )}

            <AnimatedTransition show={showContent} animation="slide-up">
              <div className="flex-1 flex flex-col pb-32">
                {/* Chat Messages Area - takes up most space when empty */}
                <div className="flex-1 flex flex-col justify-center items-center px-6">
                  {messages.length === 0 ? (
                    /* Centered welcome content when no messages */
                    <div className="text-center max-w-2xl">
                      <h2 className="text-3xl font-bold mb-4">Search Your Second Brain</h2>
                      <p className="text-base text-muted-foreground">
                        Ask questions to search across your notes, documents, and knowledge base.
                      </p>
                    </div>
                  ) : (
                    /* Chat messages when conversation exists */
                    <div className="w-full max-w-4xl space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "p-4 rounded-lg max-w-[70%]",
                            message.sender === 'user'
                              ? "bg-primary text-primary-foreground ml-auto"
                              : "bg-muted"
                          )}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <p className="text-xs opacity-70 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Fixed bottom search input */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (chatInput.trim()) {
                        handleSendMessage(chatInput);
                      }
                    }}
                    className="relative max-w-4xl mx-auto"
                  >
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask your second brain anything..."
                        className="pl-12 pr-12 py-4 text-base rounded-full border-2 border-border/50"
                      />
                      <Button 
                        type="submit" 
                        disabled={!chatInput.trim()}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full h-8 w-8 p-0"
                        size="sm"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </AnimatedTransition>
          </div>
        </div>

        <AuthModal 
          isOpen={authModalOpen} 
          onClose={() => setAuthModalOpen(false)} 
        />
      </SidebarProvider>
    </AuthGuard>
  );
};

export default SearchPage;