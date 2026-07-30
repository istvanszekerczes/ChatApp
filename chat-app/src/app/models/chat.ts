export type ChatType = 'PUBLIC_GROUP' | 'PRIVATE_GROUP' | 'PROTECTED_GROUP';

export interface Chat {
  id: string;
  type: ChatType;
  name: string | null;
  avatarColor: string | null;
  createdAt: string;
  isMember: boolean;
  participantCount: number;
}

export interface CreateChatPayload {
  type: ChatType;
  name: string;
  avatarColor: string | null;
  password?: string;
  participantIds?: string[];
}