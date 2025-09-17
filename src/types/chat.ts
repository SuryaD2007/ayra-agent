export interface ChatMessage {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_in?: number;
  tokens_out?: number;
  created_at: string;
}

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  folder_id?: string;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  chats?: Chat[];
}

export interface ContextChip {
  id: string;
  type: 'item' | 'space' | 'tag' | 'url' | 'pdf';
  label: string;
  value: string;
  removable: boolean;
}

export interface StreamingState {
  isStreaming: boolean;
  messageId: string | null;
}