import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../../services/socketService';
import type { User } from '../../../types/chatTypes';

@Component({
  selector: 'app-create-group-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './create-group-modal.html'
})
export class CreateGroupModal implements OnInit {
  @Input() isOpen: boolean = false;
  @Input() users: User[] = [];
  @Input() token: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() groupCreated = new EventEmitter<void>();

  groupName = '';
  groupDescription = '';
  selectedMembers: string[] = [];
  searchQuery = '';
  filteredUsers: User[] = [];

  constructor(private socket: SocketService) {}

  ngOnInit() {
    this.filteredUsers = this.users;
  }

  onSearchChange() {
    if (!this.searchQuery) {
      this.filteredUsers = this.users;
    } else {
      this.filteredUsers = this.users.filter(user =>
        user.username.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  }

  toggleMember(userId: string) {
    const index = this.selectedMembers.indexOf(userId);
    if (index > -1) {
      this.selectedMembers.splice(index, 1);
    } else {
      this.selectedMembers.push(userId);
    }
  }

  isMemberSelected(userId: string): boolean {
    return this.selectedMembers.includes(userId);
  }

  onCreateGroup() {
    if (!this.groupName.trim() || this.selectedMembers.length === 0) {
      return;
    }

    this.socket.createGroup(
      this.groupName.trim(),
      this.groupDescription.trim(),
      this.selectedMembers
    );

    // Reset form
    this.groupName = '';
    this.groupDescription = '';
    this.selectedMembers = [];
    this.searchQuery = '';
    this.filteredUsers = this.users;

    this.groupCreated.emit();
  }

  onClose() {
    this.close.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
