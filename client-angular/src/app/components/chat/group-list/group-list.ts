import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Group, GroupWithUnread } from '../../../types/chatTypes';

@Component({
  selector: 'app-group-list',
  imports: [CommonModule],
  templateUrl: './group-list.html'
})
export class GroupList {
  @Input() groups: GroupWithUnread[] = [];
  @Input() selectedGroup: Group | null = null;
  @Input() currentUserId: string = '';
  @Output() groupSelect = new EventEmitter<Group>();

  onGroupSelect(group: GroupWithUnread) {
    this.groupSelect.emit(group);
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

  getGroupIcon(group: GroupWithUnread): string {
    if (group.icon) {
      return group.icon;
    }
    return group.name.charAt(0).toUpperCase();
  }

  getGroupDisplayName(group: GroupWithUnread): string {
    if (group.hasLeft) {
      return `${group.name} (Left)`;
    }
    if (group.hasBeenRemoved) {
      return `${group.name} (Removed)`;
    }
    return group.name;
  }

  getSenderUsername(message: any): string {
    return message?.sender?.username || '';
  }
}
