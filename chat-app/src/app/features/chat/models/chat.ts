import { User } from "../../users/models/user";
import { Message } from "./message";

export type ChatType = 'DIRECT' | 'PUBLIC_GROUP' | 'PRIVATE_GROUP' | 'PROTECTED_GROUP';

/**
 * Represents a chat entity in the application.
 * It contains information about the chat's ID, type, name, avatar color, creator, membership status, and participant count.
 */
export interface Chat {
  id: string;
  type: ChatType;
  name: string | null;
  avatarColor: string | null;
  otherUserId?: string | null;
  createdAt: string;
  creatorId: string | null;
  isMember: boolean;
  participantCount: number;
  participants: User[];
  messages: Message[];
  messagesLoading: boolean;
  particapantsLoading: boolean;
}

/**
 * Payload structure for creating a new chat.
 * It includes the chat type, name, avatar color, optional password, and optional participant IDs.
 */
export interface CreateChatPayload {
  type: ChatType;
  name: string;
  avatarColor: string | null;
  password?: string;
  participantIds?: string[];
}