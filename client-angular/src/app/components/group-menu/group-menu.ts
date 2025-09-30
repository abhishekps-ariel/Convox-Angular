import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Group, User, OnlineUser } from '../../types/chat-types';
import { GroupInfo } from '../group-info/group-info';

@Component({
  selector: 'app-group-menu',
  standalone: true,
  imports: [CommonModule, GroupInfo],
  templateUrl: './group-menu.html',
  styleUrls: ['./group-menu.css']
})
export class GroupMenu {
  @Input() group!: Group;
  @Input() currentUser!: User;
  @Input() onlineUsers: OnlineUser[] = [];

  @Output() leaveGroup = new EventEmitter<string>();
  @Output() addMembers = new EventEmitter<string>();

  showGroupInfo = false;

  onShowGroupInfo(): void {
    this.showGroupInfo = true;
  }

  onCloseGroupInfo(): void {
    this.showGroupInfo = false;
  }

  onLeaveGroup(groupId: string): void {
    this.leaveGroup.emit(groupId);
  }

  onAddMembers(groupId: string): void {
    this.addMembers.emit(groupId);
  }
}
