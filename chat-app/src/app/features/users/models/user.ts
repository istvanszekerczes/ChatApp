/**
 * Represents a user entity in the application.
 * It contains information about the user's ID, username, email, avatar color, last online timestamp, creation timestamp, and optional authentication IDs for Google and Facebook.
 */

export interface User {
  id: string;
  username: string;
  email: string;
  avatarColor: string | null;
  lastOnline: string | null;
  createdAt: string;
  googleId: string | null;
  facebookId: string | null;
  online?: boolean;
}