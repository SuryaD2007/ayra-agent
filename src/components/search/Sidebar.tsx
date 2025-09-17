import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { 
  PlusCircle, 
  MessageSquare, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  FolderPlus,
  Settings,
  Keyboard,
  Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Chat, Folder } from '@/types/chat';
import { formatDate, groupChatsByDate } from '@/utils/chatUtils';
import UserProfile from './UserProfile';

interface SidebarProps {
  chats: Chat[];
  folders: Folder[];
  activeChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
  onChatCreate: () => void;
  onChatDelete: (chatId: string) => void;
  onChatTitleUpdate: (chatId: string, title: string) => void;
  onFolderCreate: (name: string) => void;
  onChatMoveToFolder: (chatId: string, folderId: string | null) => void;
  className?: string;
}

export function Sidebar({
  chats,
  folders,
  activeChat,
  onChatSelect,
  onChatCreate,
  onChatDelete,
  onChatTitleUpdate,
  onFolderCreate,
  onChatMoveToFolder,
  className
}: SidebarProps) {
  const [isEditingTitle, setIsEditingTitle] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const startEditingTitle = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTitle(chat.id);
    setEditTitle(chat.title);
  };

  const saveTitle = (chatId: string) => {
    if (editTitle.trim()) {
      onChatTitleUpdate(chatId, editTitle.trim());
    }
    setIsEditingTitle(null);
    setEditTitle('');
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChatDelete(chatId);
  };

  const createFolder = () => {
    if (newFolderName.trim()) {
      onFolderCreate(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const unorganizedChats = chats.filter(chat => !chat.folder_id);
  const groupedChats = groupChatsByDate(unorganizedChats);

  const renderChatItem = (chat: Chat) => (
    <div
      key={chat.id}
      onClick={() => onChatSelect(chat)}
      className={cn(
        "group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
        activeChat?.id === chat.id 
          ? "bg-primary/10 text-primary" 
          : "hover:bg-muted/50"
      )}
    >
      <MessageSquare size={16} className="flex-shrink-0" />
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
              className="h-6 py-0 text-sm"
            />
          </form>
        ) : (
          <p className="text-sm truncate">{chat.title}</p>
        )}
      </div>
      <div className={cn(
        "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
        activeChat?.id === chat.id && "opacity-100"
      )}>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-6 w-6" 
          onClick={(e) => startEditingTitle(chat, e)}
        >
          <Edit3 size={12} />
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-6 w-6" 
          onClick={(e) => handleDeleteChat(chat.id, e)}
        >
          <Trash2 size={12} />
        </Button>
      </div>
    </div>
  );

  return (
    <div className={cn("w-80 h-full bg-card border-r flex flex-col", className)}>
      {/* Header with New Chat */}
      <div className="p-4 border-b">
        <Button 
          onClick={onChatCreate}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <PlusCircle size={16} />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {/* Folders */}
          {folders.map(folder => {
            const folderChats = chats.filter(chat => chat.folder_id === folder.id);
            const isExpanded = expandedFolders.has(folder.id);
            
            return (
              <Collapsible key={folder.id} open={isExpanded} onOpenChange={() => toggleFolder(folder.id)}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="text-sm font-medium">{folder.name}</span>
                    <span className="text-xs text-muted-foreground">({folderChats.length})</span>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-4 mt-2 space-y-1">
                  {folderChats.map(renderChatItem)}
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          {/* New Folder Button */}
          <div className="px-2">
            {isCreatingFolder ? (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  createFolder();
                }}
                className="flex gap-2"
              >
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  autoFocus
                  onBlur={() => {
                    if (!newFolderName.trim()) {
                      setIsCreatingFolder(false);
                    }
                  }}
                  className="h-8 text-sm"
                />
              </form>
            ) : (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsCreatingFolder(true)}
                className="w-full justify-start gap-2 text-muted-foreground"
              >
                <FolderPlus size={16} />
                New Folder
              </Button>
            )}
          </div>

          {folders.length > 0 && <Separator />}

          {/* Ungrouped Chats */}
          {groupedChats.map(([dateLabel, chatsInGroup]) => (
            <div key={dateLabel}>
              <h3 className="text-xs font-medium text-muted-foreground px-2 mb-2">
                {dateLabel}
              </h3>
              <div className="space-y-1">
                {chatsInGroup.map(renderChatItem)}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t space-y-2">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1 justify-start gap-2">
            <Settings size={16} />
            Settings
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 justify-start gap-2">
            <Keyboard size={16} />
            Shortcuts
          </Button>
        </div>
        
        <UserProfile />
      </div>
    </div>
  );
}