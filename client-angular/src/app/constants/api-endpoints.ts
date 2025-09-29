export const AUTH_ENDPOINTS = {
  LOGIN: 'http://localhost:5000/api/auth/login',
  REGISTER: 'http://localhost:5000/api/auth/register',
  USERS: 'http://localhost:5000/api/auth/users',
  PROFILE: 'http://localhost:5000/api/auth/profile',
  BLOCK: (userId: string) => `http://localhost:5000/api/auth/block/${userId}`,
  UNBLOCK: (userId: string) => `http://localhost:5000/api/auth/unblock/${userId}`,
  BLOCK_STATUS: (userId: string) => `http://localhost:5000/api/auth/block-status/${userId}`,
};

export const MESSAGE_ENDPOINTS = {
  BASE: 'http://localhost:5000/api/messages',
  CONVERSATIONS: 'http://localhost:5000/api/messages/conversations',
  BY_RECEIVER: (receiverId: string) => `http://localhost:5000/api/messages/${receiverId}`,
  MARK_READ: (senderId: string) => `http://localhost:5000/api/messages/mark-read/${senderId}`,
  EDIT: (messageId: string) => `http://localhost:5000/api/messages/edit/${messageId}`,
  DELETE_FOR_ME: (messageId: string) => `http://localhost:5000/api/messages/delete-for-me/${messageId}`,
  DELETE_FOR_EVERYONE: (messageId: string) => `http://localhost:5000/api/messages/delete-for-everyone/${messageId}`,
};

export const GROUP_ENDPOINTS = {
  BASE: 'http://localhost:5000/api/groups',
  BY_ID: (groupId: string) => `http://localhost:5000/api/groups/${groupId}`,
  MEMBERS: (groupId: string) => `http://localhost:5000/api/groups/${groupId}/members`,
  MEMBER: (groupId: string, memberId: string) => `http://localhost:5000/api/groups/${groupId}/members/${memberId}`,
  LEAVE: (groupId: string) => `http://localhost:5000/api/groups/${groupId}/leave`,
  MESSAGES: (groupId: string, page: number, limit: number) => `http://localhost:5000/api/groups/${groupId}/messages?page=${page}&limit=${limit}`,
  MARK_READ: (groupId: string) => `http://localhost:5000/api/groups/${groupId}/mark-read`,
  ICON: (groupId: string) => `http://localhost:5000/api/groups/${groupId}/icon`,
  COMMON: (userId: string) => `http://localhost:5000/api/groups/common/${userId}`,
};
