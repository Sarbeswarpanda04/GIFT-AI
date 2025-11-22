export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export enum AppMode {
  CHAT = 'chat',
  IMAGE_GEN = 'image_gen',
  LIVE = 'live'
}

export enum ViewMode {
  CHAT = 'chat',
  LIBRARY = 'library',
  PROFILE = 'profile'
}

export interface Attachment {
  file: File;
  mimeType: string;
  previewUrl: string;
  base64Data?: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text?: string;
  attachments?: Attachment[];
  timestamp: number;
  isThinking?: boolean;
  groundingUrls?: { title: string; uri: string }[];
  generatedMedia?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    mimeType: string;
  }[];
}

export interface GenerationConfigState {
  aspectRatio: string;
  imageSize: string;
  searchEnabled: boolean;
  thinkingMode: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatar?: string;
  preferences: {
    autoSave: boolean;
    theme: 'dark' | 'light'; // Kept for structure, app is forced dark for now
  };
}

export interface ConversationSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastModified: number;
  preview: string;
}

export interface SavedCreation {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  timestamp: number;
  aspectRatio?: string;
}

export const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"];
export const IMAGE_SIZES = ["1K", "2K", "4K"];