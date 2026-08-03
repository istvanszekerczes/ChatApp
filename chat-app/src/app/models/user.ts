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