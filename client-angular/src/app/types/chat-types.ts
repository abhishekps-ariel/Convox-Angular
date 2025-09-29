export interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  profilePicture?: string;
}

export interface Message {
  _id: string;
  sender: { _id: string; username: string; email?: string; bio?: string; profilePicture?: string };
  receiver?: { _id: string; username: string; email?: string; bio?: string; profilePicture?: string };
  group?: { _id: string; name: string };
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  messageType: 'text' | 'image' | 'video' | 'system';
  createdAt: string;
  isRead?: boolean;
  isEdited?: boolean;
  editedAt?: string;
  deletedForSender?: boolean;
  deletedForReceiver?: boolean;
  deletedForEveryone?: boolean;
  deletedForUsers?: string[];
  deletedAt?: string;
  removedMemberId?: string;
}

export interface Conversation {
  _id: string;
  username: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  lastMessage: Message | null;
  unreadCount: number;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  createdBy: { _id: string; username: string };
  members: {
    user: { _id: string; username: string; email: string; profilePicture?: string };
    role: 'admin' | 'member';
    joinedAt: string;
  }[];
  leftMembers?: {
    user: { _id: string; username: string; email: string };
    leftAt: string;
  }[];
  removedMembers?: {
    user: { _id: string; username: string; email: string };
    removedAt: string;
    removedBy: { _id: string; username: string };
  }[];
  latestMessage?: {
    messageId: string;
    text?: string;
    messageType: 'text' | 'image' | 'video' | 'system';
    sender: string;
    senderUsername?: string;
    createdAt: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  hasLeft?: boolean;
  hasBeenRemoved?: boolean;
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
