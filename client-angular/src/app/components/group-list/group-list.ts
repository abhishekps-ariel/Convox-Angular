import { Component, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Group, OnlineUser } from '../../types/chat-types';

@Component({
  selector: 'app-group-list',
  imports: [CommonModule],
  templateUrl: './group-list.html'
})
export class GroupList {
  // Inputs
  groups = input<Group[]>([]);
  onlineUsers = input<OnlineUser[]>([]);
  selectedGroup = input<Group | null>(null);

  // Outputs
  onGroupSelect = output<Group>();

  // Helper methods
  getOnlineMemberCount(group: Group): number {
    return group.members.filter(member =>
      this.onlineUsers().some(onlineUser => onlineUser.userId === member.user._id)
    ).length;
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

  getGroupInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : 'G';
  }

  onGroupClick(group: Group) {
    console.log('GroupList: Group clicked:', group);
    this.onGroupSelect.emit(group);
  }
}
