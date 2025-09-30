import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { User, Group } from '../../types/chat-types';

@Component({
  selector: 'app-add-members-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-members-modal.html',
  styleUrls: ['./add-members-modal.css']
})
export class AddMembersModal implements OnInit {
  @Input() isOpen = false;
  @Input() group: Group | null = null;
  @Input() currentUserId = '';
  @Input() token = '';

  @Output() close = new EventEmitter<void>();
  @Output() membersAdded = new EventEmitter<void>();

  availableUsers: User[] = [];
  selectedUserIds: string[] = [];
  isLoading = false;
  isSubmitting = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    if (this.isOpen && this.group) {
      this.loadAvailableUsers();
    }
  }

  async loadAvailableUsers(): Promise<void> {
    if (!this.token || !this.group) return;
    
    this.isLoading = true;
    try {
      const users = await this.apiService.fetchUsers(this.token);
      console.log('Fetched users:', users);
      
      // Filter out users who are already members of the group
      const existingMemberIds = this.group.members.map(member => 
        typeof member.user === 'string' ? member.user : member.user._id
      );
      console.log('Existing member IDs:', existingMemberIds);
      
      const available = users.filter(user => 
        user.id !== this.currentUserId &&
        !existingMemberIds.includes(user.id)
      );
      console.log('Available users:', available);
      this.availableUsers = available;
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      this.isLoading = false;
    }
  }

  toggleUser(userId: string): void {
    console.log('Toggling user:', userId, 'Current selected:', this.selectedUserIds);
    if (this.selectedUserIds.includes(userId)) {
      this.selectedUserIds = this.selectedUserIds.filter(id => id !== userId);
    } else {
      this.selectedUserIds = [...this.selectedUserIds, userId];
    }
    console.log('New selection:', this.selectedUserIds);
  }

  async onSubmit(): Promise<void> {
    if (!this.group || this.selectedUserIds.length === 0 || !this.token) return;

    this.isSubmitting = true;
    try {
      await this.apiService.addMembersToGroup(this.token, this.group._id, this.selectedUserIds);
      this.membersAdded.emit();
      this.onClose();
      this.selectedUserIds = [];
    } catch (error: any) {
      console.error('Error adding members:', error);
      const errorMessage = error?.message || 'Failed to add members to group';
      alert(errorMessage);
    } finally {
      this.isSubmitting = false;
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
