import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User, Conversation, OnlineUser } from '../../types/chat-types';
import { formatLastMessageTime } from '../../utils/date-utils';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './conversation-list.html',
  styleUrls: ['./conversation-list.css']
})
export class ConversationList {
  @Input() conversations: Conversation[] = [];
  @Input() selectedUser: User | null = null;
  @Input() currentUserId = '';
  @Input() isUserBlockedByMe: (userId: string) => boolean = () => false;
  @Input() isUserOnline: (userId: string) => boolean = () => false;

  @Output() userSelect = new EventEmitter<User>();

  formatLastMessageTime(dateString: string): string {
    return formatLastMessageTime(dateString);
  }

  onConversationClick(conversation: Conversation): void {
    const user: User = {
      id: conversation._id,
      username: conversation.username,
      email: conversation.email,
      bio: conversation.bio,
      profilePicture: conversation.profilePicture
    };
    this.userSelect.emit(user);
  }

  getLastMessagePreview(conv: Conversation): string {
    if (!conv.lastMessage) return 'No messages yet';
    
    if (conv.lastMessage.deletedForEveryone) {
      return 'This message was deleted';
    }
    
    if (conv.lastMessage.messageType === 'image') {
      return '📷 Image';
    }
    
    if (conv.lastMessage.messageType === 'video') {
      return '🎥 Video';
    }
    
    return conv.lastMessage.text || 'No messages yet';
  }
}
