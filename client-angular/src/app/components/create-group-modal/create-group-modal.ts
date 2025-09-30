import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { User } from '../../types/chat-types';

@Component({
  selector: 'app-create-group-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-group-modal.html',
  styleUrls: ['./create-group-modal.css']
})
export class CreateGroupModal {
  @Input() isOpen = false;
  @Input() users: User[] = [];
  @Input() token = '';

  @Output() close = new EventEmitter<void>();
  @Output() groupCreated = new EventEmitter<void>();

  groupName = '';
  description = '';
  selectedMembers: string[] = [];
  isLoading = false;
  error = '';
  groupIcon = '';

  constructor(private apiService: ApiService) {}

  toggleMember(userId: string): void {
    if (this.selectedMembers.includes(userId)) {
      this.selectedMembers = this.selectedMembers.filter(id => id !== userId);
    } else {
      this.selectedMembers = [...this.selectedMembers, userId];
    }
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    if (!this.groupName.trim()) {
      this.error = 'Group name is required';
      return;
    }

    if (this.selectedMembers.length === 0) {
      this.error = 'Please select at least one member';
      return;
    }

    this.isLoading = true;
    this.error = '';

    try {
      await this.apiService.createGroup(
        this.token,
        this.groupName.trim(),
        this.description.trim(),
        this.selectedMembers,
        this.groupIcon || undefined
      );
      
      this.groupName = '';
      this.description = '';
      this.selectedMembers = [];
      this.groupIcon = '';
      this.groupCreated.emit();
      this.onClose();
    } catch (err: any) {
      this.error = err?.message || 'Failed to create group';
    } finally {
      this.isLoading = false;
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.groupIcon = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeIcon(): void {
    this.groupIcon = '';
  }
}
