import React, { useState } from 'react';
import { PlusCircle, Search, Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Chat {
  id: string;
  title: string;
  messages: any[];
  createdAt: Date;
}

interface ChatSidebarProps {
  isOpen: boolean;
  chats: Chat[];
  activeChat: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onEditChat: (chatId: string, newTitle: string) => void;
  onDeleteChat: (chatId: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  chats,
  activeChat,
  onNewChat,
  onSelectChat,
  onEditChat,
  onDeleteChat
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startEdit = (chat: Chat) => {
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      onEditChat(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const groupChatsByDate = (chats: Chat[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups = {
      Today: [] as Chat[],
      Yesterday: [] as Chat[],
      'Last Week': [] as Chat[]
    };

    chats.forEach(chat => {
      const chatDate = new Date(chat.createdAt);
      const chatDay = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());

      if (chatDay.getTime() === today.getTime()) {
        groups.Today.push(chat);
      } else if (chatDay.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(chat);
      } else if (chatDate >= lastWeek) {
        groups['Last Week'].push(chat);
      }
    });

    return groups;
  };

  const chatGroups = groupChatsByDate(chats);

  return (
    <div className={cn(
      "bg-muted/30 border-r border-border/50 flex flex-col transition-all duration-300",
      isOpen ? "w-64" : "w-0 overflow-hidden"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onNewChat}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(chatGroups).map(([groupName, groupChats]) => {
          if (groupChats.length === 0) return null;

          return (
            <div key={groupName} className="p-2">
              <div className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
                {groupName}
              </div>
              <div className="space-y-1">
                {groupChats.map(chat => (
                  <div
                    key={chat.id}
                    className={cn(
                      "group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                      activeChat === chat.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => onSelectChat(chat.id)}
                  >
                    <Search className="h-4 w-4 flex-shrink-0" />
                    
                    {editingId === chat.id ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        onBlur={saveEdit}
                        className="h-6 text-xs"
                        autoFocus
                      />
                    ) : (
                      <span className="flex-1 text-sm truncate">
                        {chat.title}
                      </span>
                    )}

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(chat);
                        }}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};