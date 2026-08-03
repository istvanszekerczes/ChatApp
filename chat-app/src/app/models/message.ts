export interface Message {
  id: string;
  chatId: string;
  content: string;
  createdAt: string;
  userId: string;
  user: {
    username: string;
    avatarColor: string | null;
  };
}