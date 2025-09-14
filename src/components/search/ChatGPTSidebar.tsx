import React from 'react';
import { Plus, MessageSquare, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Chat } from '@/types/chat';
import { groupChatsByDate } from '@/utils/chatUtils';
import { cn } from '@/lib/utils';
import UserProfile from './UserProfile';

interface ChatGPTSidebarProps {
  chats: Chat[];
  activeChat: Chat | null;
  setActiveChat: (chat: Chat) => void;
  createNewChat: () => void;
  deleteChat: (chatId: string, e: React.MouseEvent) => void;
  showSidebar: boolean;
  isEditingTitle: string | null;
  editTitle: string;
  setEditTitle: (title: string) => void;
  startEditingTitle: (chatId: string, e: React.MouseEvent) => void;
  saveTitle: (chatId: string) => void;
}

const ChatGPTSidebar: React.FC<ChatGPTSidebarProps> = ({
  chats,
  activeChat,
  setActiveChat,
  createNewChat,
  deleteChat,
  showSidebar,
  isEditingTitle,
  editTitle,
  setEditTitle,
  startEditingTitle,
  saveTitle,
}) => {
  if (!showSidebar) return null;

  const groupedChats = groupChatsByDate(chats);

  const handleChatSelect = (chat: Chat) => {
    setActiveChat(chat);
  };

  return (
    <div className="w-64 border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={createNewChat}
          className="w-full justify-start gap-2 h-11 text-sm font-medium"
          variant="outline"
        >
          <Plus size={16} />
          New chat
        </Button>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2">
          {groupedChats.map(([date, dateChats]) => (
            <div key={date} className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground px-2 py-1 sticky top-0 bg-background/90 backdrop-blur-sm">
                {date}
              </div>
              {dateChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat)}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-lg p-2 text-sm cursor-pointer transition-colors hover:bg-accent/50",
                    activeChat?.id === chat.id ? "bg-accent text-accent-foreground" : "text-foreground"
                  )}
                >
                  <MessageSquare size={16} className="flex-shrink-0" />
                  
                  {isEditingTitle === chat.id ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => saveTitle(chat.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveTitle(chat.id);
                        }
                        e.stopPropagation();
                      }}
                      className="flex-1 h-6 text-xs"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1 truncate">
                      {chat.title}
                    </span>
                  )}
                  
                  {(activeChat?.id === chat.id) && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={(e) => startEditingTitle(chat.id, e)}
                      >
                        <Edit2 size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => deleteChat(chat.id, e)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* User Profile at Bottom */}
      <UserProfile />
    </div>
  );
};

export default ChatGPTSidebar;