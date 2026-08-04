/**
 * Represents a message entity in the application.
 * It contains information about the message's ID, associated chat ID, content, creation timestamp, user ID, and user details.
 */
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