import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User, Message, OnlineUser, Conversation, Group } from '../../types/chat-types';
import { LeftSidebar } from '../left-sidebar/left-sidebar';

@Component({
  selector: 'app-chat-interface',
  imports: [CommonModule, LeftSidebar],
  templateUrl: './chat-interface.html'
})
export class ChatInterface {
  // State management using signals
  conversations = signal<Conversation[]>([]);
  allUsers = signal<User[]>([]);
  selectedUser = signal<User | null>(null);
  selectedGroup = signal<Group | null>(null);
  messages = signal<Message[]>([]);
  onlineUsers = signal<OnlineUser[]>([]);
  socket = signal<any>(null);
  
  // Current user from auth service
  user = signal<User | null>(null);

  constructor(private authService: AuthService) {
    // Subscribe to auth service changes
    this.authService.user$.subscribe(user => {
      this.user.set(user);
      
      // Reset all state when user changes (logout/login)
      if (!user) {
        this.conversations.set([]);
        this.allUsers.set([]);
        this.selectedUser.set(null);
        this.selectedGroup.set(null);
        this.messages.set([]);
        this.onlineUsers.set([]);
      }
    });
  }

  // Event handlers
  onUserSelect(user: User | null) {
    this.selectedUser.set(user);
    this.selectedGroup.set(null); // Close any selected group
  }

  onGroupSelect(group: Group | null) {
    this.selectedGroup.set(group);
    this.selectedUser.set(null); // Close any selected user
  }

  onConversationsChange(conversations: Conversation[]) {
    this.conversations.set(conversations);
  }

  onAllUsersChange(users: User[]) {
    this.allUsers.set(users);
  }

  onSocketChange(socket: any) {
    this.socket.set(socket);
  }

  onMessagesChange(messages: Message[]) {
    this.messages.set(messages);
  }

  onOnlineUsersChange(onlineUsers: OnlineUser[]) {
    this.onlineUsers.set(onlineUsers);
  }

  onGroupsChange(groups: any[]) {
    // Groups will be managed by LeftSidebar component
    // This is a placeholder for future implementation
  }
}
