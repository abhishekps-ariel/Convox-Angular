export interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  profilePicture?: string;
}

export interface Message {
  _id: string;
  sender: string;
  receiver?: string;
  group?: string;
  text?: string;
  imageData?: string;
  videoData?: string;
  messageType: 'text' | 'image' | 'video';
  timestamp: Date;
  isRead: boolean;
  isEdited?: boolean;
  editedAt?: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedFor?: 'me' | 'everyone';
}

export interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: Date;
}

export interface Group {
  _id: string;
  name: string;
  description: string;
  members: User[];
  admin: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: Message;
  unreadCount: number;
}

export interface OnlineUser {
  userId: string;
  socketId: string;
  username: string;
  profilePicture?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  loading: boolean;
}
