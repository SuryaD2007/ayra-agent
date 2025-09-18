import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Chat, Message, Folder } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';

export function useChatSession() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Load chats and folders
  const loadChats = useCallback(async () => {
    if (!user) return;

    try {
      const [chatsResponse, foldersResponse] = await Promise.all([
        supabase
          .from('chats')
          .select('*')
          .order('updated_at', { ascending: false }),
        supabase
          .from('folders')
          .select('*')
          .order('name', { ascending: true })
      ]);

      if (chatsResponse.data) setChats(chatsResponse.data);
      if (foldersResponse.data) setFolders(foldersResponse.data);
    } catch (error) {
      console.error('Error loading chats:', error);
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
      setMessages(data as Message[] || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  // Create new chat
  const createNewChat = useCallback(async (title = 'New Chat', folderId?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title,
          folder_id: folderId
        })
        .select()
        .single();

      if (error) throw error;
      
      setChats(prev => [data, ...prev]);
      setActiveChat(data);
      setMessages([]);
      
      return data;
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
  }, [activeChat]);

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
  }, [activeChat]);

  // Send message
  const sendMessage = useCallback(async (content: string, context?: any) => {
    if (!activeChat || !user) return;

    setIsLoading(true);
    setIsStreaming(true);

    try {
      // Check if content contains a YouTube URL
      const isVideoLink = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/i.test(content);
      
      if (isVideoLink) {
        // Add user message first
        const userMessage = {
          chat_id: activeChat.id,
          role: 'user' as const,
          content
        };

        const { data: userMessageData, error: userError } = await supabase
          .from('messages')
          .insert(userMessage)
          .select()
          .single();

        if (userError) throw userError;
        setMessages(prev => [...prev, userMessageData as Message]);

        // Process video transcript
        const { data: videoData, error: videoError } = await supabase.functions.invoke('process-video-transcript', {
          body: {
            url: content.trim(),
            query: 'Provide a comprehensive summary of this video',
            userId: user.id
          }
        });

        if (videoError) throw videoError;

        if (!videoData.success) {
          throw new Error(videoData.error || 'Failed to process video');
        }

        // Add assistant response with video summary
        const assistantMessage = {
          chat_id: activeChat.id,
          role: 'assistant' as const,
          content: `**${videoData.videoTitle}**\n\n${videoData.response}`
        };

        const { data: assistantMessageData, error: assistantError } = await supabase
          .from('messages')
          .insert(assistantMessage)
          .select()
          .single();

        if (assistantError) throw assistantError;
        setMessages(prev => [...prev, assistantMessageData as Message]);

      } else {
        // Regular text message processing
        const userMessage = {
          chat_id: activeChat.id,
          role: 'user' as const,
          content
        };

        const { data: userMessageData, error: userError } = await supabase
          .from('messages')
          .insert(userMessage)
          .select()
          .single();

        if (userError) throw userError;
        setMessages(prev => [...prev, userMessageData as Message]);

        // Call ChatGPT API
        const { data, error } = await supabase.functions.invoke('chat-gpt', {
          body: {
            messages: [...messages, userMessageData].map(msg => ({
              type: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content
            })),
            context,
            itemId: context?.itemId
          }
        });

        if (error) throw error;

        // Add assistant response
        const assistantMessage = {
          chat_id: activeChat.id,
          role: 'assistant' as const,
          content: data.success ? data.response : 'I apologize, but I encountered an issue with the AI service. This is likely due to API quota limits. Please check your OpenAI account billing and try again.'
        };

        const { data: assistantMessageData, error: assistantError } = await supabase
          .from('messages')
          .insert(assistantMessage)
          .select()
          .single();

        if (assistantError) throw assistantError;
        setMessages(prev => [...prev, assistantMessageData as Message]);
      }

      // Auto-generate title for first message if it's a regular text message
      if (messages.length === 0 && !isVideoLink) {
        const autoTitle = content.length > 60 ? content.substring(0, 57) + '...' : content;
        await updateChatTitle(activeChat.id, autoTitle);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        chat_id: activeChat.id,
        role: 'assistant' as const,
        content: 'I apologize, but I encountered a technical issue. This is likely due to AI service quota limits. Please check your OpenAI account credits and try again.'
      };

      const { data: errorMessageData } = await supabase
        .from('messages')
        .insert(errorMessage)
        .select()
        .single();

      if (errorMessageData) {
        setMessages(prev => [...prev, errorMessageData as Message]);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [activeChat, user, messages, updateChatTitle]);

  // Create folder
  const createFolder = useCallback(async (name: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          user_id: user.id,
          name
        })
        .select()
        .single();

      if (error) throw error;
      
      setFolders(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      return null;
    }
  }, [user]);

  // Select chat
  const selectChat = useCallback((chat: Chat) => {
    setActiveChat(chat);
    loadMessages(chat.id);
  }, [loadMessages]);

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user, loadChats]);

  return {
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
    createFolder,
    selectChat,
    setIsStreaming
  };
}