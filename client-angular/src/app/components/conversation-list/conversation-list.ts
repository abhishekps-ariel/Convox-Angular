import { Component, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation, OnlineUser } from '../../types/chat-types';

@Component({
  selector: 'app-conversation-list',
  imports: [CommonModule],
  templateUrl: './conversation-list.html'
})
export class ConversationList {
  // Inputs
  conversations = input<Conversation[]>([]);
  onlineUsers = input<OnlineUser[]>([]);
  selectedUser = input<any>(null);

  // Outputs
  onUserSelect = output<any>();

  // Helper methods
  isUserOnline(userId: string): boolean {
    return this.onlineUsers().some((u) => u.userId === userId);
  }

  formatLastMessageTime(createdAt: string): string {
    const date = new Date(createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  }

  getUserInitial(username: string): string {
    return username ? username.charAt(0).toUpperCase() : 'U';
  }

  onConversationClick(conversation: Conversation) {
    console.log('ConversationList: Conversation clicked:', conversation);
    // Create a user object from conversation data
    const user = {
      id: conversation._id,
      username: conversation.username,
      email: conversation.email,
      bio: conversation.bio,
      profilePicture: conversation.profilePicture
    };
    console.log('ConversationList: Emitting user:', user);
    this.onUserSelect.emit(user);
  }
}
