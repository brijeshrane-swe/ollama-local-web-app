export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  thinking?: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  ollamaHost: string;
  modelName: string;
  theme: 'light' | 'dark' | 'system';
  username: string;
  encryptionKey?: string; // For "secure" local storage
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  settings: Settings;
  isStreaming: boolean;
  error: string | null;
}
