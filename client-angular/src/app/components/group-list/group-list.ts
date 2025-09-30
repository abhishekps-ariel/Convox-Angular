import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Group, GroupWithUnread } from '../../types/chat-types';
import { formatLastMessageTime } from '../../utils/date-utils';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './group-list.html',
  styleUrls: ['./group-list.css']
})
export class GroupList {
  @Input() groups: GroupWithUnread[] = [];
  @Input() selectedGroup: Group | null = null;
  @Input() currentUserId = '';

  @Output() groupSelect = new EventEmitter<Group>();

  formatLastMessageTime(dateString: string): string {
    return formatLastMessageTime(dateString);
  }

  onGroupClick(group: GroupWithUnread): void {
    this.groupSelect.emit(group);
  }

  getLastMessagePreview(group: GroupWithUnread): string {
    if (group.hasBeenRemoved) return 'You were removed from this group';
    if (group.hasLeft) return 'You left the group';
    if (!group.lastMessage) return 'No messages yet';
    
    const msg = group.lastMessage;
    
    if (msg.deletedForEveryone) return 'This message was deleted';
    if (msg.messageType === 'system') return msg.text;
    
    const prefix = msg.sender._id === this.currentUserId ? 'You: ' : `${msg.sender.username}: `;
    
    if (msg.messageType === 'image') return prefix + '📷 Image';
    if (msg.messageType === 'video') return prefix + '🎥 Video';
    
    return prefix + msg.text;
  }
}
