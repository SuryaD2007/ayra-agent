import React, { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { ChatSidebar, ChatMessages, ChatInput } from '@/components/search';
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
  const [authError, setAuthError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // Chat state management
  const [chats, setChats] = useState<Chat[]>([
    {
      id: '1',
      title: 'New Chat',
      messages: [],
      createdAt: new Date()
    }
  ]);
  const [activeChat, setActiveChat] = useState<string>('1');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentChat = chats.find(chat => chat.id === activeChat);
  const messages = currentChat?.messages || [];

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
        // Create a new chat if all are deleted
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

    // Simulate AI response after delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `Based on your search for '${content}', I found several relevant notes in your second brain. Would you like me to summarize the key insights?`,
        sender: 'ai',
        timestamp: new Date(),
      };

      setChats(prev => prev.map(chat => 
        chat.id === activeChat 
          ? { ...chat, messages: [...chat.messages, aiResponse] }
          : chat
      ));
    }, 800);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const getHeaderTitle = () => {
    if (currentChat && currentChat.messages.length > 0) {
      return currentChat.title;
    }
    return "Universal Search";
  };

  return (
    <AuthGuard 
      title="Search your knowledge"
      description="Sign in to search through your notes, documents, and saved content."
    >
      <div className="h-screen flex overflow-hidden">
        {authError && (
          <div className="absolute top-4 left-4 right-4 z-50">
            <InlineError 
              message={authError}
              onSignIn={() => setAuthModalOpen(true)}
            />
          </div>
        )}

        <AnimatedTransition show={showContent} animation="fade">
          {/* Sidebar */}
          <ChatSidebar
            isOpen={sidebarOpen}
            chats={chats}
            activeChat={activeChat}
            onNewChat={createNewChat}
            onSelectChat={setActiveChat}
            onEditChat={editChat}
            onDeleteChat={deleteChat}
          />

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <header className="h-16 flex items-center gap-4 px-6 border-b border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex-shrink-0"
              >
                <SearchIcon className="w-4 h-4" />
              </Button>
              <h1 className="text-lg font-semibold truncate">
                {getHeaderTitle()}
              </h1>
            </header>

            {/* Messages Area */}
            <ChatMessages
              messages={messages}
              showSuggestions={messages.length > 0}
              onSuggestionClick={handleSuggestionClick}
            />

            {/* Input Area */}
            <ChatInput onSendMessage={sendMessage} />
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