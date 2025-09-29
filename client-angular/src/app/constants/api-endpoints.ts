import { environment } from "../environment/environment";

const BASE_API= environment.apiUrl;

export const AUTH_ENDPOINTS = {
  LOGIN: `${BASE_API}/api/auth/login`,
  REGISTER: `${BASE_API}/api/auth/register`,
  USERS: `${BASE_API}/api/auth/users`,
  PROFILE: `${BASE_API}/api/auth/profile`,
  BLOCK: (userId: string) => `${BASE_API}/api/auth/block/${userId}`,
  UNBLOCK: (userId: string) => `${BASE_API}/api/auth/unblock/${userId}`,
  BLOCK_STATUS: (userId: string) => `${BASE_API}/api/auth/block-status/${userId}`,
};

export const MESSAGE_ENDPOINTS = {
  BASE: `${BASE_API}/api/messages`,
  CONVERSATIONS: `${BASE_API}/api/messages/conversations`,
  BY_RECEIVER: (receiverId: string) => `${BASE_API}/api/messages/${receiverId}`,
  MARK_READ: (senderId: string) => `${BASE_API}/api/messages/mark-read/${senderId}`,
  EDIT: (messageId: string) => `${BASE_API}/api/messages/edit/${messageId}`,
  DELETE_FOR_ME: (messageId: string) => `${BASE_API}/api/messages/delete-for-me/${messageId}`,
  DELETE_FOR_EVERYONE: (messageId: string) => `${BASE_API}/api/messages/delete-for-everyone/${messageId}`,
};

export const GROUP_ENDPOINTS = {
  BASE: `${BASE_API}/api/groups`,
  BY_ID: (groupId: string) => `${BASE_API}/api/groups/${groupId}`,
  MEMBERS: (groupId: string) => `${BASE_API}/api/groups/${groupId}/members`,
  MEMBER: (groupId: string, memberId: string) => `${BASE_API}/api/groups/${groupId}/members/${memberId}`,
  LEAVE: (groupId: string) => `${BASE_API}/api/groups/${groupId}/leave`,
  MESSAGES: (groupId: string, page: number, limit: number) =>
    `${BASE_API}/api/groups/${groupId}/messages?page=${page}&limit=${limit}`,
  MARK_READ: (groupId: string) => `${BASE_API}/api/groups/${groupId}/mark-read`,
  ICON: (groupId: string) => `${BASE_API}/api/groups/${groupId}/icon`,
  COMMON: (userId: string) => `${BASE_API}/api/groups/common/${userId}`,
};
