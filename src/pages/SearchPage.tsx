import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { cn } from '@/lib/utils';
import AuthGuard from '@/components/auth/AuthGuard';
import InlineError from '@/components/auth/InlineError';
import AuthModal from '@/components/AuthModal';

// Import new modular components
import { ChatSidebar } from '@/components/search/ChatSidebar';
import { ChatHeader } from '@/components/search/ChatHeader';
import { MessageList } from '@/components/search/MessageList';
import { Composer } from '@/components/search/Composer';

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

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

interface ContextItem {
  id: string;
  title: string;
  type: string;
  isPdf?: boolean;
  hasExtractedText?: boolean;
}

const SearchPage = () => {
  const showContent = useAnimateIn(false, 300);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // UI State
  const [authError, setAuthError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPaneOpen, setRightPaneOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Chat State (preserve existing functionality)
  const [chats, setChats] = useState<Chat[]>([
    {
      id: '1',
      title: 'New Chat',
      messages: [],
      createdAt: new Date()
    }
  ]);
  
  // Get active chat from URL or default to first chat
  const chatId = searchParams.get('chat') || '1';
  const [activeChat, setActiveChat] = useState<string>(chatId);
  
  // Context items from URL itemId parameter
  const itemId = searchParams.get('itemId');
  const [contextItems, setContextItems] = useState<ContextItem[]>([]);
  
  // Responsive handling
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle itemId from URL parameters
  useEffect(() => {
    if (itemId) {
      // Mock context item - in real app, fetch from Supabase
      const mockContextItem: ContextItem = {
        id: itemId,
        title: 'Sample Document',
        type: 'PDF',
        isPdf: true,
        hasExtractedText: false
      };
      setContextItems([mockContextItem]);
    } else {
      setContextItems([]);
    }
  }, [itemId]);

  // Update URL when chat changes
  useEffect(() => {
    if (activeChat !== chatId) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('chat', activeChat);
      setSearchParams(newParams);
    }
  }, [activeChat, chatId, searchParams, setSearchParams]);

  const currentChat = chats.find(chat => chat.id === activeChat);
  const messages = currentChat?.messages || [];

  // Chat Management Functions (preserve existing functionality)
  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date()
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChat.id);
  };

  const deleteChat = (chatId: string) => {
    setChats(prev => {
      const filtered = prev.filter(chat => chat.id !== chatId);
      if (activeChat === chatId && filtered.length > 0) {
        setActiveChat(filtered[0].id);
      } else if (filtered.length === 0) {
        const newChat: Chat = {
          id: Date.now().toString(),
          title: 'New Chat',
          messages: [],
          createdAt: new Date()
        };
        setActiveChat(newChat.id);
        return [newChat];
      }
      return filtered;
    });
  };

  const editChat = (chatId: string, newTitle: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, title: newTitle } : chat
    ));
  };

  const sendMessage = (content: string) => {
    if (!content.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    // Update chat with new message and auto-generate title if first message
    setChats(prev => prev.map(chat => {
      if (chat.id === activeChat) {
        const isFirstMessage = chat.messages.length === 0;
        const title = isFirstMessage 
          ? (content.length > 25 ? content.slice(0, 25) + '...' : content)
          : chat.title;
        
        return {
          ...chat,
          title,
          messages: [...chat.messages, newMessage]
        };
      }
      return chat;
    }));

    // Simulate AI response with streaming
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `Based on your search for '${content}', I found several relevant notes in your second brain. Would you like me to summarize the key insights?`,
        sender: 'ai',
        timestamp: new Date(),
        sources: [
          {
            id: '1',
            title: 'Machine Learning Fundamentals',
            domain: 'example.com',
            favicon: '/favicon.ico'
          }
        ]
      };

      setChats(prev => prev.map(chat => 
        chat.id === activeChat 
          ? { ...chat, messages: [...chat.messages, aiResponse] }
          : chat
      ));
    }, 800);
  };

  // Context Management
  const removeContext = (itemId: string) => {
    setContextItems(prev => prev.filter(item => item.id !== itemId));
    // Also remove from URL
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('itemId');
    setSearchParams(newParams);
  };

  const backToLibrary = (itemId: string) => {
    navigate(`/manage?itemId=${itemId}`);
  };

  // Right Pane Management
  const mockSources = messages
    .filter(m => m.sender === 'ai' && m.sources)
    .flatMap(m => m.sources?.map(s => ({ ...s, messageId: m.id, url: `https://${s.domain}` })) || []);

  const getHeaderTitle = () => {
    if (currentChat && currentChat.messages.length > 0) {
      return currentChat.title;
    }
    return "New Chat";
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'n') {
        e.preventDefault();
        createNewChat();
      }
      if (e.key === 'Escape') {
        setRightPaneOpen(false);
        if (isMobile) {
          setSidebarOpen(false);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Focus search in sidebar (could be implemented)
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [isMobile]);

  return (
    <AuthGuard 
      title="Search your knowledge"
      description="Sign in to search through your notes, documents, and saved content."
    >
      <div className="h-screen flex overflow-hidden bg-background">
        {authError && (
          <div className="absolute top-4 left-4 right-4 z-50">
            <InlineError 
              message={authError}
              onSignIn={() => setAuthModalOpen(true)}
            />
          </div>
        )}

        <AnimatedTransition show={showContent} animation="fade">
          {/* Mobile Header */}
          {isMobile && (
            <div className="absolute top-0 left-0 right-0 z-40 h-14 bg-background border-b border-border/50 flex items-center px-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-3"
              >
                <Menu className="w-4 h-4" />
              </Button>
              <h1 className="font-semibold text-sm truncate">
                {getHeaderTitle()}
              </h1>
            </div>
          )}

          {/* Mobile Overlay */}
          {isMobile && sidebarOpen && (
            <div 
              className="absolute inset-0 bg-black/20 z-30"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Left Sidebar */}
          <ChatSidebar
            isOpen={sidebarOpen}
            chats={chats}
            activeChat={activeChat}
            onNewChat={createNewChat}
            onSelectChat={setActiveChat}
            onEditChat={editChat}
            onDeleteChat={deleteChat}
            isMobile={isMobile}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />

          {/* Main Content Area */}
          <div className={cn(
            "flex-1 flex flex-col min-w-0",
            isMobile && "mt-14"
          )}>
            {/* Chat Header - only show on desktop */}
            {!isMobile && (
              <ChatHeader chatTitle={getHeaderTitle()} />
            )}

            {/* Messages Area */}
            <MessageList
              messages={messages}
              onSourceClick={(messageId, sourceId) => {
                setRightPaneOpen(true);
                // Could scroll to specific source
              }}
              className="flex-1"
            />

            {/* Composer */}
            <Composer
              onSendMessage={sendMessage}
              disabled={false}
            />
          </div>

          {/* Right Pane - hidden in this design */}
          {/* RightPane component removed to match reference */}
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