import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Chat, ChatMessage, Folder, StreamingState } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';

export function useChatSession() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    messageId: null
  });
  const [loading, setLoading] = useState(true);

  // Load chats and folders
  const loadChatsAndFolders = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load folders
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (foldersError) throw foldersError;
      
      // Load chats
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (chatsError) throw chatsError;
      
      setFolders(foldersData || []);
      setChats(chatsData || []);
    } catch (error) {
      console.error('Error loading chats and folders:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load messages for a chat
  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setMessages((data || []) as ChatMessage[]);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  }, []);

  // Create new chat
  const createChat = useCallback(async (title = 'New Chat', folderId?: string) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert({
          title,
          folder_id: folderId,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const newChat = data as Chat;
      setChats(prev => [newChat, ...prev]);
      setActiveChat(newChat);
      setMessages([]);
      
      return newChat;
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  }, [user]);

  // Update chat title
  const updateChatTitle = useCallback(async (chatId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ title })
        .eq('id', chatId);
      
      if (error) throw error;
      
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title } : chat
      ));
      
      if (activeChat?.id === chatId) {
        setActiveChat(prev => prev ? { ...prev, title } : null);
      }
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  }, [activeChat?.id]);

  // Delete chat
  const deleteChat = useCallback(async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);
      
      if (error) throw error;
      
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      if (activeChat?.id === chatId) {
        setActiveChat(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  }, [activeChat?.id]);

  // Send message
  const sendMessage = useCallback(async (content: string, context?: any) => {
    if (!activeChat || !user) return;
    
    try {
      // Add user message
      const { data: userMessage, error: userError } = await supabase
        .from('messages')
        .insert({
          chat_id: activeChat.id,
          role: 'user',
          content
        })
        .select()
        .single();
      
      if (userError) throw userError;
      
      const newUserMessage = userMessage as ChatMessage;
      setMessages(prev => [...prev, newUserMessage]);
      
      // Start streaming
      setStreamingState({ isStreaming: true, messageId: 'streaming' });
      
      // Call ChatGPT function
      const { data, error } = await supabase.functions.invoke('chat-gpt', {
        body: {
          messages: [...messages, newUserMessage].map(msg => ({
            type: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          context
        }
      });
      
      if (error) throw error;
      
      // Add assistant response
      const { data: assistantMessage, error: assistantError } = await supabase
        .from('messages')
        .insert({
          chat_id: activeChat.id,
          role: 'assistant',
          content: data.success ? data.response : 'Sorry, I encountered an error. Please try again.',
          tokens_in: data.tokens_used?.input || null,
          tokens_out: data.tokens_used?.output || null
        })
        .select()
        .single();
      
      if (assistantError) throw assistantError;
      
      const newAssistantMessage = assistantMessage as ChatMessage;
      setMessages(prev => [...prev, newAssistantMessage]);
      
      // Auto-title chat if it's the first message
      if (messages.length === 0 && activeChat.title === 'New Chat') {
        const autoTitle = content.slice(0, 60).replace(/\s+/g, ' ').trim();
        await updateChatTitle(activeChat.id, autoTitle);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        chat_id: activeChat.id,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setStreamingState({ isStreaming: false, messageId: null });
    }
  }, [activeChat, user, messages, updateChatTitle]);

  // Select chat
  const selectChat = useCallback((chat: Chat) => {
    setActiveChat(chat);
    loadMessages(chat.id);
  }, [loadMessages]);

  // Create folder
  const createFolder = useCallback(async (name: string) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          name,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const newFolder = data as Folder;
      setFolders(prev => [newFolder, ...prev]);
      
      return newFolder;
    } catch (error) {
      console.error('Error creating folder:', error);
      return null;
    }
  }, [user]);

  // Move chat to folder
  const moveChatToFolder = useCallback(async (chatId: string, folderId: string | null) => {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ folder_id: folderId })
        .eq('id', chatId);
      
      if (error) throw error;
      
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, folder_id: folderId } : chat
      ));
      
    } catch (error) {
      console.error('Error moving chat to folder:', error);
    }
  }, []);

  useEffect(() => {
    loadChatsAndFolders();
  }, [loadChatsAndFolders]);

  return {
    chats,
    folders,
    activeChat,
    messages,
    streamingState,
    loading,
    createChat,
    updateChatTitle,
    deleteChat,
    sendMessage,
    selectChat,
    createFolder,
    moveChatToFolder,
    loadChatsAndFolders
  };
}