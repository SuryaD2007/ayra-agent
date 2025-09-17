import React, { useState } from 'react';
import { PlusCircle, MessageSquare, Edit3, Trash2, ChevronDown, ChevronRight, FolderPlus, Settings, Keyboard, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Chat, Folder } from '@/types/chat';
import { formatDate, groupChatsByDate } from '@/utils/chatUtils';

interface SidebarProps {
  chats: Chat[];
  folders: Folder[];
  activeChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  onCreateChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onUpdateChatTitle: (chatId: string, title: string) => void;
  onCreateFolder: (name: string) => void;
}

export function Sidebar({
  chats,
  folders,
  activeChat,
  onSelectChat,
  onCreateChat,
  onDeleteChat,
  onUpdateChatTitle,
  onCreateFolder
}: SidebarProps) {
  const [editingChat, setEditingChat] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const startEditingTitle = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChat(chat.id);
    setEditTitle(chat.title);
  };

  const saveTitle = () => {
    if (editingChat && editTitle.trim()) {
      onUpdateChatTitle(editingChat, editTitle.trim());
    }
    setEditingChat(null);
    setEditTitle('');
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteChat(chatId);
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

  const createFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setCreatingFolder(false);
    }
  };

  // Group chats by folder and date
  const unfolderChats = chats.filter(chat => !chat.folder_id);
  const folderChats = folders.map(folder => ({
    folder,
    chats: chats.filter(chat => chat.folder_id === folder.id)
  }));

  const groupedUnfolderChats = groupChatsByDate(unfolderChats);

  return (
    <div className="w-80 h-full bg-muted/30 border-r border-border/50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <Button
          onClick={onCreateChat}
          className="w-full justify-start gap-3 h-11"
          variant="outline"
        >
          <PlusCircle size={18} />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {/* Folders */}
          {folderChats.map(({ folder, chats: folderChats }) => (
            <div key={folder.id}>
              <div
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted/50 group"
                onClick={() => toggleFolder(folder.id)}
              >
                {expandedFolders.has(folder.id) ? (
                  <ChevronDown size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronRight size={16} className="text-muted-foreground" />
                )}
                <span className="text-sm font-medium text-muted-foreground">
                  {folder.name}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {folderChats.length}
                </span>
              </div>
              
              {expandedFolders.has(folder.id) && (
                <div className="ml-4 space-y-1">
                  {folderChats.map(chat => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={activeChat?.id === chat.id}
                      isEditing={editingChat === chat.id}
                      editTitle={editTitle}
                      onSelect={onSelectChat}
                      onStartEdit={startEditingTitle}
                      onSaveEdit={saveTitle}
                      onCancelEdit={() => setEditingChat(null)}
                      onDelete={handleDeleteChat}
                      onEditTitleChange={setEditTitle}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Unfoldered chats by date */}
          {groupedUnfolderChats.map(([dateLabel, dateChats]) => (
            <div key={dateLabel}>
              <h3 className="text-xs font-medium text-muted-foreground px-2 mb-2">
                {dateLabel}
              </h3>
              <div className="space-y-1">
                {dateChats.map(chat => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={activeChat?.id === chat.id}
                    isEditing={editingChat === chat.id}
                    editTitle={editTitle}
                    onSelect={onSelectChat}
                    onStartEdit={startEditingTitle}
                    onSaveEdit={saveTitle}
                    onCancelEdit={() => setEditingChat(null)}
                    onDelete={handleDeleteChat}
                    onEditTitleChange={setEditTitle}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* New Folder */}
          <div className="px-2">
            {creatingFolder ? (
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
                      setCreatingFolder(false);
                    }
                  }}
                  className="h-8 text-sm"
                />
              </form>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreatingFolder(true)}
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              >
                <FolderPlus size={16} />
                New Folder
              </Button>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3"
        >
          <Settings size={16} />
          Settings
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3"
        >
          <Keyboard size={16} />
          Shortcuts
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3"
        >
          <Palette size={16} />
          Theme
        </Button>
      </div>
    </div>
  );
}

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  onSelect: (chat: Chat) => void;
  onStartEdit: (chat: Chat, e: React.MouseEvent) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (chatId: string, e: React.MouseEvent) => void;
  onEditTitleChange: (title: string) => void;
}

function ChatItem({
  chat,
  isActive,
  isEditing,
  editTitle,
  onSelect,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onEditTitleChange
}: ChatItemProps) {
  return (
    <div
      className={cn(
        "p-2 rounded-lg flex items-center gap-2 cursor-pointer group transition-all duration-200",
        isActive 
          ? "bg-primary/10 text-primary" 
          : "hover:bg-muted/50"
      )}
      onClick={() => onSelect(chat)}
    >
      <MessageSquare size={16} className="flex-shrink-0" />
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              onSaveEdit();
            }}
          >
            <Input
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              autoFocus
              onBlur={onSaveEdit}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  onCancelEdit();
                }
              }}
              className="h-6 py-0 text-sm"
            />
          </form>
        ) : (
          <p className="text-sm truncate">{chat.title}</p>
        )}
      </div>
      <div className={cn(
        "flex gap-1 transition-opacity duration-200",
        "opacity-0 group-hover:opacity-100",
        isActive ? "opacity-100" : ""
      )}>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-7 w-7" 
          onClick={(e) => onStartEdit(chat, e)}
        >
          <Edit3 size={12} />
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-7 w-7" 
          onClick={(e) => onDelete(chat.id, e)}
        >
          <Trash2 size={12} />
        </Button>
      </div>
    </div>
  );
}