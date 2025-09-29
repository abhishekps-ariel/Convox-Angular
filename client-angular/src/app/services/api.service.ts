import { Injectable } from '@angular/core';
import { AUTH_ENDPOINTS, MESSAGE_ENDPOINTS, GROUP_ENDPOINTS } from '../constants/api-endpoints';
import { User, Message, Conversation, Group } from '../types/chat-types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private getAuthHeaders(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  private getJsonHeaders(token: string) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  // Helper function for GET requests with auth
  async makeGetRequest<T>(
    url: string,
    token: string,
    logout?: () => void,
    operationName?: string
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: this.getAuthHeaders(token),
      });

      if (response.status === 401 || response.status === 403) {
        logout?.();
        return [] as T;
      }
      if (!response.ok) {
        throw new Error(`Error ${operationName || 'fetching data'}: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API ${operationName || 'request'} error:`, error);
      return [] as T;
    }
  }

  // Helper function for POST/PUT/DELETE requests with auth
  async makeRequest<T>(
    url: string,
    token: string,
    method: 'POST' | 'PUT' | 'DELETE',
    body?: any,
    operationName?: string
  ): Promise<T | null> {
    try {
      const headers = body 
        ? this.getJsonHeaders(token)
        : this.getAuthHeaders(token);

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${operationName || 'performing operation'}: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API ${operationName || 'request'} error:`, error);
      throw error;
    }
  }

  // Helper function for requests that return data with specific structure
  async makeDataRequest<T>(
    url: string,
    token: string,
    method: 'POST' | 'PUT' = 'POST',
    body?: any,
    dataKey?: string,
    operationName?: string
  ): Promise<T | null> {
    try {
      const response = await this.makeRequest<any>(url, token, method, body, operationName);
      return dataKey ? response?.[dataKey] : response;
    } catch (error) {
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const response = await fetch(AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Authentication failed');
    }

    return data;
  }

  async register(username: string, email: string, password: string): Promise<{ token: string; user: User }> {
    const response = await fetch(AUTH_ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  }

  // User methods
  async fetchUsers(token: string, logout: () => void): Promise<User[]> {
    return this.makeGetRequest<User[]>(
      AUTH_ENDPOINTS.USERS,
      token,
      logout,
      'fetching users'
    );
  }

  async updateProfile(
    token: string,
    profileData: { bio?: string; profilePicture?: string }
  ): Promise<User> {
    const response = await this.makeRequest<any>(
      AUTH_ENDPOINTS.PROFILE,
      token,
      'PUT',
      profileData,
      'updating profile'
    );
    return response?.user;
  }

  // Message methods
  async fetchConversations(token: string, logout: () => void): Promise<Conversation[]> {
    return this.makeGetRequest<Conversation[]>(
      MESSAGE_ENDPOINTS.CONVERSATIONS,
      token,
      logout,
      'fetching conversations'
    );
  }

  async fetchMessages(
    token: string,
    receiverId: string,
    logout: () => void
  ): Promise<Message[]> {
    const data = await this.makeGetRequest<Message[]>(
      MESSAGE_ENDPOINTS.BY_RECEIVER(receiverId),
      token,
      logout,
      'fetching messages'
    );
    return Array.isArray(data) ? data : [];
  }

  async sendMessage(
    token: string,
    receiverId: string,
    text: string,
    messageType: 'text' | 'image' | 'video' = 'text',
    imageData?: string,
    videoData?: string
  ): Promise<Message | null> {
    const body: any = { receiverId, messageType };
    if (messageType === 'text') body.text = text;
    if (messageType === 'image' && imageData) body.imageData = imageData;
    if (messageType === 'video' && videoData) body.videoData = videoData;

    return this.makeRequest<Message>(
      MESSAGE_ENDPOINTS.BASE,
      token,
      'POST',
      body,
      'sending message'
    );
  }

  async markMessagesAsRead(
    token: string,
    senderId: string
  ): Promise<{ modifiedCount: number } | null> {
    return this.makeRequest<{ modifiedCount: number }>(
      MESSAGE_ENDPOINTS.MARK_READ(senderId),
      token,
      'PUT',
      undefined,
      'marking messages as read'
    );
  }

  // Group methods
  async fetchUserGroups(token: string, logout: () => void): Promise<Group[]> {
    const data = await this.makeGetRequest<{ groups: Group[] }>(
      GROUP_ENDPOINTS.BASE,
      token,
      logout,
      'fetching groups'
    );
    return data?.groups || [];
  }

  async createGroup(
    token: string,
    name: string,
    description: string,
    memberIds: string[],
    icon?: string
  ): Promise<Group | null> {
    return this.makeDataRequest<Group>(
      GROUP_ENDPOINTS.BASE,
      token,
      'POST',
      { name, description, memberIds, icon },
      'group',
      'creating group'
    );
  }

  async fetchGroupMessages(
    token: string,
    groupId: string,
    page = 1,
    limit = 50
  ): Promise<Message[]> {
    const data = await this.makeGetRequest<{ messages: Message[] }>(
      GROUP_ENDPOINTS.MESSAGES(groupId, page, limit),
      token,
      undefined,
      'fetching group messages'
    );
    return data?.messages || [];
  }
}
