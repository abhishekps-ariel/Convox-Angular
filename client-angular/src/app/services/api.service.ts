import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AUTH_ENDPOINTS, MESSAGE_ENDPOINTS, GROUP_ENDPOINTS } from '../constants/api-endpoints';
import { User, Message, Conversation, Group } from '../types/chat-types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  private getHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Groups
  async fetchGroupsInCommon(token: string, userId: string): Promise<Group[]> {
    try {
      const headers = this.getHeaders(token);
      return await firstValueFrom(
        this.http.get<Group[]>(GROUP_ENDPOINTS.COMMON(userId), { headers })
      );
    } catch (error) {
      console.error('Error fetching groups in common:', error);
      return [];
    }
  }

  // Users
  async fetchUsers(token: string): Promise<User[]> {
    try {
      const headers = this.getHeaders(token);
      return await firstValueFrom(
        this.http.get<User[]>(AUTH_ENDPOINTS.USERS, { headers })
      );
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  // Conversations
  async fetchConversations(token: string): Promise<Conversation[]> {
    try {
      const headers = this.getHeaders(token);
      return await firstValueFrom(
        this.http.get<Conversation[]>(MESSAGE_ENDPOINTS.CONVERSATIONS, { headers })
      );
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  // Messages
  async fetchMessages(token: string, receiverId: string): Promise<Message[]> {
    try {
      const headers = this.getHeaders(token);
      const data = await firstValueFrom(
        this.http.get<Message[]>(MESSAGE_ENDPOINTS.BY_RECEIVER(receiverId), { headers })
    );
    return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async sendMessage(
    token: string,
    receiverId: string,
    text: string,
    messageType: 'text' | 'image' | 'video' = 'text',
    imageData?: string,
    videoData?: string
  ): Promise<Message | null> {
    try {
      const headers = this.getHeaders(token);
    const body: any = { receiverId, messageType };
    if (messageType === 'text') body.text = text;
    if (messageType === 'image' && imageData) body.imageData = imageData;
    if (messageType === 'video' && videoData) body.videoData = videoData;

      return await firstValueFrom(
        this.http.post<Message>(MESSAGE_ENDPOINTS.BASE, body, { headers })
      );
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  async markMessagesAsRead(token: string, senderId: string): Promise<{ modifiedCount: number } | null> {
    try {
      const headers = this.getHeaders(token);
      return await firstValueFrom(
        this.http.put<{ modifiedCount: number }>(MESSAGE_ENDPOINTS.MARK_READ(senderId), {}, { headers })
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return null;
    }
  }

  async editMessage(token: string, messageId: string, text: string): Promise<Message | null> {
    try {
      const headers = this.getHeaders(token);
      return await firstValueFrom(
        this.http.put<Message>(MESSAGE_ENDPOINTS.EDIT(messageId), { text }, { headers })
      );
    } catch (error) {
      console.error('Error editing message:', error);
      return null;
    }
  }

  async deleteMessageForMe(token: string, messageId: string): Promise<{ message: string; messageId: string } | null> {
    try {
      const headers = this.getHeaders(token);
      return await firstValueFrom(
        this.http.delete<{ message: string; messageId: string }>(
          MESSAGE_ENDPOINTS.DELETE_FOR_ME(messageId), 
          { headers }
        )
      );
    } catch (error) {
      console.error('Error deleting message for me:', error);
      return null;
    }
  }

  async deleteMessageForEveryone(token: string, messageId: string): Promise<{ message: string; messageId: string } | null> {
    try {
      const headers = this.getHeaders(token);
      return await firstValueFrom(
        this.http.delete<{ message: string; messageId: string }>(
          MESSAGE_ENDPOINTS.DELETE_FOR_EVERYONE(messageId), 
          { headers }
        )
      );
    } catch (error) {
      console.error('Error deleting message for everyone:', error);
      return null;
    }
  }

  // Blocking
  async blockUser(token: string, userId: string): Promise<{ message: string } | null> {
    try {
      const headers = this.getHeaders(token);
      return await firstValueFrom(
        this.http.post<{ message: string }>(AUTH_ENDPOINTS.BLOCK(userId), {}, { headers })
      );
    } catch (error) {
      console.error('Error blocking user:', error);
      return null;
    }
  }

  async unblockUser(token: string, userId: string): Promise<{ message: string } | null> {
    try {
      const headers = this.getHeaders(token);
      return await firstValueFrom(
        this.http.post<{ message: string }>(AUTH_ENDPOINTS.UNBLOCK(userId), {}, { headers })
      );
    } catch (error) {
      console.error('Error unblocking user:', error);
      return null;
    }
  }

  async checkBlockStatus(
    token: string,
    userId: string
  ): Promise<{ isBlockedByMe: boolean; isBlockedByThem: boolean; isBlocked: boolean } | null> {
    try {
      const headers = this.getHeaders(token);
      return await firstValueFrom(
        this.http.get<{ isBlockedByMe: boolean; isBlockedByThem: boolean; isBlocked: boolean }>(
          AUTH_ENDPOINTS.BLOCK_STATUS(userId), 
          { headers }
        )
      );
    } catch (error) {
      console.error('Error checking block status:', error);
      return null;
    }
  }

  async updateProfile(
    token: string,
    profileData: { bio?: string; profilePicture?: string }
  ): Promise<User | null> {
    try {
      const headers = this.getHeaders(token);
      const response = await firstValueFrom(
        this.http.put<{ user: User }>(AUTH_ENDPOINTS.PROFILE, profileData, { headers })
      );
      return response?.user || null;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  }

  // Group management
  async createGroup(
    token: string,
    name: string,
    description: string,
    memberIds: string[],
    icon?: string
  ): Promise<Group | null> {
    try {
      const headers = this.getHeaders(token);
      return await firstValueFrom(
        this.http.post<Group>(GROUP_ENDPOINTS.BASE, { name, description, memberIds, icon }, { headers })
      );
    } catch (error) {
      console.error('Error creating group:', error);
      return null;
    }
  }

  async fetchUserGroups(token: string): Promise<Group[]> {
    try {
      const headers = this.getHeaders(token);
      const data = await firstValueFrom(
        this.http.get<{ groups: Group[] }>(GROUP_ENDPOINTS.BASE, { headers })
      );
      return data?.groups || [];
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  }

  async fetchGroupDetails(token: string, groupId: string): Promise<Group | null> {
    try {
      const headers = this.getHeaders(token);
      const data = await firstValueFrom(
        this.http.get<{ group: Group }>(GROUP_ENDPOINTS.BY_ID(groupId), { headers })
    );
    return data?.group || null;
    } catch (error) {
      console.error('Error fetching group details:', error);
      return null;
    }
  }

  async addMembersToGroup(token: string, groupId: string, memberIds: string[]): Promise<Group | null> {
    try {
      const headers = this.getHeaders(token);
      const response = await firstValueFrom(
        this.http.post<{ group: Group }>(GROUP_ENDPOINTS.MEMBERS(groupId), { memberIds }, { headers })
    );
    return response?.group || null;
    } catch (error) {
      console.error('Error adding members:', error);
      return null;
    }
  }

  async removeMemberFromGroup(
    token: string,
    groupId: string,
    memberId: string
  ): Promise<{ message: string } | null> {
    try {
      const headers = this.getHeaders(token);
      return await firstValueFrom(
        this.http.delete<{ message: string }>(
      GROUP_ENDPOINTS.MEMBER(groupId, memberId),
          { headers }
        )
      );
    } catch (error) {
      console.error('Error removing member:', error);
      return null;
    }
  }

  async leaveGroup(token: string, groupId: string): Promise<{ message: string } | null> {
    try {
      const headers = this.getHeaders(token);
      return await firstValueFrom(
        this.http.delete<{ message: string }>(GROUP_ENDPOINTS.LEAVE(groupId), { headers })
      );
    } catch (error) {
      console.error('Error leaving group:', error);
      return null;
    }
  }

  async fetchGroupMessages(
    token: string,
    groupId: string,
    page = 1,
    limit = 50
  ): Promise<Message[]> {
    try {
      const headers = this.getHeaders(token);
      const data = await firstValueFrom(
        this.http.get<{ messages: Message[] }>(
          GROUP_ENDPOINTS.MESSAGES(groupId, page, limit), 
          { headers }
        )
      );
      return data?.messages || [];
    } catch (error) {
      console.error('Error fetching group messages:', error);
      return [];
    }
  }

  async markGroupMessagesAsRead(
    token: string,
    groupId: string
  ): Promise<{ modifiedCount: number } | null> {
    try {
      const headers = this.getHeaders(token);
      return await firstValueFrom(
        this.http.put<{ modifiedCount: number }>(
      GROUP_ENDPOINTS.MARK_READ(groupId),
          {}, 
          { headers }
        )
      );
    } catch (error) {
      console.error('Error marking group messages as read:', error);
      return null;
    }
  }

  async updateGroupIcon(token: string, groupId: string, icon: string): Promise<Group | null> {
    try {
      const headers = this.getHeaders(token);
      return await firstValueFrom(
        this.http.put<Group>(GROUP_ENDPOINTS.ICON(groupId), { icon }, { headers })
      );
    } catch (error) {
      console.error('Error updating group icon:', error);
      return null;
    }
  }

  async removeGroupIcon(token: string, groupId: string): Promise<Group | null> {
    try {
      const headers = this.getHeaders(token);
      return await firstValueFrom(
        this.http.delete<Group>(GROUP_ENDPOINTS.ICON(groupId), { headers })
      );
    } catch (error) {
      console.error('Error removing group icon:', error);
      return null;
    }
  }

  async removeGroupMember(token: string, groupId: string, memberId: string): Promise<Group | null> {
    try {
      const headers = this.getHeaders(token);
      return await firstValueFrom(
        this.http.delete<Group>(GROUP_ENDPOINTS.MEMBER(groupId, memberId), { headers })
      );
    } catch (error) {
      console.error('Error removing group member:', error);
      return null;
    }
  }
}