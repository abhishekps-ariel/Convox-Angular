import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { User, Conversation, OnlineUser } from '../../../types/chatTypes';

@Component({
  selector: 'app-conversation-list',
  imports: [CommonModule],
  templateUrl: './conversation-list.html'
})
export class ConversationList {
  @Input() conversations: Conversation[] = [];
  @Input() selectedUser: User | null = null;
  @Input() currentUserId: string = '';
  @Input() isUserBlockedByMe!: (userId: string) => boolean;
  @Input() isUserOnline!: (userId: string) => boolean;
  @Output() userSelect = new EventEmitter<User>();

  onUserSelect(conversation: Conversation) {
    const user: User = {
      id: conversation._id,
      username: conversation.username,
      email: conversation.email,
      bio: conversation.bio,
      profilePicture: conversation.profilePicture
    };
    this.userSelect.emit(user);
  }

  formatLastMessage(message: any): string {
    if (!message) return '';
    
    if (message.deletedForEveryone) {
      return 'This message was deleted';
    }
    
    if (message.deletedForSender || message.deletedForReceiver) {
      return 'This message was deleted';
    }
    
    if (message.messageType === 'image') {
      return '📷 Image';
    }
    
    if (message.messageType === 'video') {
      return '🎥 Video';
    }
    
    if (message.messageType === 'system') {
      return message.text;
    }
    
    return message.text || '';
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d`;
    }
    
    return date.toLocaleDateString();
  }
}
