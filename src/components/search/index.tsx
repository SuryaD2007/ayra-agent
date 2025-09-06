
import React, { useState, useEffect } from 'react';
import { SearchIcon, ArrowLeft, X, AlertTriangle, RotateCcw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Chat, ChatMessage } from '@/types/chat';
import { generateId, createNewChat as createNewChatUtil } from '@/utils/chatUtils';
import { CortexItem } from '@/components/manage/cortex-data';
import ChatSidebar from './ChatSidebar';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { EnhancedPdfViewer } from '@/components/manage/EnhancedPdfViewer';
import { restoreItem } from '@/lib/data';
import { useSignedUrl } from '@/hooks/useSignedUrl';

interface SearchProps {
  itemId?: string | null;
}

export const Search: React.FC<SearchProps> = ({ itemId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [preloadedItem, setPreloadedItem] = useState<CortexItem | null>(null);
  const [isItemDeleted, setIsItemDeleted] = useState(false);
  
  // Check if PDF needs signed URL
  const isPdfWithoutContent = preloadedItem?.type === 'PDF' && !preloadedItem.content && !preloadedItem.description;
  const { url: pdfSignedUrl } = useSignedUrl({
    bucket: 'ayra-files',
    path: isPdfWithoutContent ? preloadedItem?.file_path || null : null,
    expiresIn: 3600,
    refreshThreshold: 0.8
  });
  
  // Load preloaded item if itemId is provided
  useEffect(() => {
    if (itemId) {
      try {
        const stored = localStorage.getItem('cortex-items');
        if (stored) {
          const items: CortexItem[] = JSON.parse(stored);
          const item = items.find((item: CortexItem) => item.id === itemId);
          if (item) {
            setPreloadedItem(item);
            setIsItemDeleted(false);
          } else {
            // Check if item was recently deleted
            const deletedItems = localStorage.getItem('recently-deleted-items');
            if (deletedItems) {
              const deleted: CortexItem[] = JSON.parse(deletedItems);
              const deletedItem = deleted.find(item => item.id === itemId);
              if (deletedItem) {
                setPreloadedItem(deletedItem);
                setIsItemDeleted(true);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading preloaded item:', error);
      }
    }
  }, [itemId]);
  
  // Initialize with a sample chat on first render
  useEffect(() => {
    if (chats.length === 0) {
      const newChat = createNewChatUtil();
      // If we have a preloaded item, add a system context message
      if (preloadedItem) {
        const contextContent = getItemContent(preloadedItem);
        
        let systemMessageContent: string;
        
        // Special handling for PDFs without extracted content
        if (isPdfWithoutContent && pdfSignedUrl) {
          systemMessageContent = `Use the linked PDF as context: ${pdfSignedUrl}. Start by summarizing.`;
        } else {
          systemMessageContent = `I have access to: "${preloadedItem.title}" (${preloadedItem.type}). Feel free to ask questions about this content.`;
        }
        
        const systemMessage: ChatMessage = {
          id: generateId(),
          type: 'assistant',
          content: systemMessageContent,
          timestamp: new Date()
        };
        newChat.messages = [systemMessage];
        newChat.title = `Chat about: ${preloadedItem.title}`;
      }
      setChats([newChat]);
      setActiveChat(newChat);
    }
  }, [preloadedItem, isPdfWithoutContent, pdfSignedUrl]);

  // Create a new chat
  const createNewChat = () => {
    const newChat = createNewChatUtil();
    setChats([newChat, ...chats]);
    setActiveChat(newChat);
  };

  // Delete a chat
  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);
    
    // If we deleted the active chat, set the first available chat as active
    if (activeChat && activeChat.id === chatId) {
      setActiveChat(updatedChats.length > 0 ? updatedChats[0] : null);
    }
    
    // If no chats left, create a new one
    if (updatedChats.length === 0) {
      createNewChat();
    }
  };

  // Edit chat title
  const startEditingTitle = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setIsEditingTitle(chatId);
      setEditTitle(chat.title);
    }
  };

  const saveTitle = (chatId: string) => {
    const updatedChats = chats.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, title: editTitle || 'Untitled Chat' };
      }
      return chat;
    });
    setChats(updatedChats);
    setIsEditingTitle(null);
  };

  // Handle message submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && activeChat) {
      // Create user message
      const userMessage: ChatMessage = {
        id: generateId(),
        type: 'user',
        content: searchQuery,
        timestamp: new Date()
      };
      
      // Update chat with new message
      const updatedChats = chats.map(chat => {
        if (chat.id === activeChat.id) {
          // If this is the first message, update the chat title
          let updatedTitle = chat.title;
          if (chat.messages.length === 0) {
            updatedTitle = searchQuery.length > 25 
              ? `${searchQuery.substring(0, 22)}...` 
              : searchQuery;
          }
          
          return {
            ...chat,
            title: updatedTitle,
            messages: [...chat.messages, userMessage],
            updatedAt: new Date()
          };
        }
        return chat;
      });
      
      setChats(updatedChats);
      setSearchQuery('');
      
      // Find the updated active chat
      const updatedActiveChat = updatedChats.find(chat => chat.id === activeChat.id);
      if (updatedActiveChat) {
        setActiveChat(updatedActiveChat);
        
        // Add AI response after a short delay
        setTimeout(() => {
          const aiMessage: ChatMessage = {
            id: generateId(),
            type: 'assistant',
            content: `Based on your search for "${userMessage.content}", I found several relevant notes in your second brain. Would you like me to summarize the key insights?`,
            timestamp: new Date()
          };
          
          const updatedChatsWithAi = updatedChats.map(chat => {
            if (chat.id === activeChat.id) {
              return {
                ...chat,
                messages: [...chat.messages, aiMessage],
                updatedAt: new Date()
              };
            }
            return chat;
          });
          
          setChats(updatedChatsWithAi);
          const updatedActiveChatWithAi = updatedChatsWithAi.find(chat => chat.id === activeChat.id);
          if (updatedActiveChatWithAi) {
            setActiveChat(updatedActiveChatWithAi);
          }
        }, 800);
      }
    }
  };

  // Get content from item for context
  const getItemContent = (item: CortexItem) => {
    if (item.type === 'Note') {
      return item.content || item.description || '';
    } else if (item.type === 'PDF') {
      return item.content || item.description || `PDF document: ${item.title}`;
    } else if (item.type === 'Link') {
      return item.content || item.description || `Link: ${item.url}`;
    }
    return item.description || '';
  };

  const handleRestoreItem = async () => {
    if (!preloadedItem) return;
    
    try {
      await restoreItem(preloadedItem.id);
      
      // Remove from localStorage deleted items
      const deletedItems = localStorage.getItem('recently-deleted-items');
      if (deletedItems) {
        const deleted: CortexItem[] = JSON.parse(deletedItems);
        const filtered = deleted.filter(i => i.id !== preloadedItem.id);
        localStorage.setItem('recently-deleted-items', JSON.stringify(filtered));
      }
      
      setIsItemDeleted(false);
      toast({
        title: "Item restored",
        description: "The item has been restored to your library.",
      });
      
      // Refresh the page to show updated content
      window.location.reload();
    } catch (error) {
      console.error('Error restoring item:', error);
      toast({
        title: "Error",
        description: "Failed to restore the item. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="w-full h-[calc(100vh-120px)] flex">
      {/* Deleted Item Banner */}
      {isItemDeleted && preloadedItem && (
        <div className="absolute top-0 left-0 right-0 z-10">
          <Alert className="mx-4 mt-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-amber-800 dark:text-amber-200">
                This item was deleted
              </span>
              <Button size="sm" variant="outline" onClick={handleRestoreItem}>
                <RotateCcw size={14} className="mr-1" />
                Restore
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Sidebar with chat history */}
      <ChatSidebar 
        chats={chats}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        createNewChat={createNewChat}
        deleteChat={deleteChat}
        showSidebar={showSidebar}
        isEditingTitle={isEditingTitle}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        startEditingTitle={startEditingTitle}
        saveTitle={saveTitle}
      />
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header with toggle */}
        <div className="border-b py-2 px-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className="mr-2"
            >
              <SearchIcon size={18} />
            </Button>
            <h2 className="font-medium">
              {activeChat?.title || 'Universal Search'}
            </h2>
          </div>
          
          {/* Preloaded item chips */}
          {preloadedItem && (
            <div className="flex items-center gap-2">
              {/* Main item chip */}
              <Badge variant="outline" className="flex items-center gap-1">
                {preloadedItem.type === 'Note' && '📝'}
                {preloadedItem.type === 'PDF' && '📄'}
                {preloadedItem.type === 'Link' && '🔗'}
                {preloadedItem.type === 'Image' && '🖼️'}
                <span className="max-w-[150px] truncate">{preloadedItem.title}</span>
                <span className="text-xs text-muted-foreground">• {preloadedItem.type}</span>
              </Badge>
              
              {/* PDF context chip */}
              {isPdfWithoutContent && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <FileText size={12} />
                  <span className="text-xs">PDF context</span>
                </Badge>
              )}
              
              <Button asChild variant="ghost" size="sm">
                <Link to={`/manage?itemId=${preloadedItem.id}`} className="flex items-center gap-1">
                  <ArrowLeft size={14} />
                  Back to Library
                </Link>
              </Button>
            </div>
          )}
        </div>
        
        {/* Chat messages area */}
        <ChatMessages activeChat={activeChat} />
        
        {/* Input area */}
        <ChatInput 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSubmit={handleSubmit}
          isFocused={isFocused}
          setIsFocused={setIsFocused}
        />
      </div>
    </div>
  );
};

export default Search;
