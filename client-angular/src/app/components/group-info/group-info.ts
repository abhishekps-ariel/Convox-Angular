import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Group, User, OnlineUser } from '../../types/chat-types';

@Component({
  selector: 'app-group-info',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageCropperComponent],
  templateUrl: './group-info.html',
  styleUrls: ['./group-info.css']
})
export class GroupInfo implements OnInit {
  @Input() group!: Group;
  @Input() currentUser!: User;
  @Input() onlineUsers: OnlineUser[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() leaveGroup = new EventEmitter<string>();
  @Output() addMembers = new EventEmitter<string>();

  isLeaving = false;
  isUpdatingIcon = false;
  currentGroupIcon: string | undefined;
  removingMemberId: string | null = null;
  token: string | null = null;
  
  // Image cropper state - EXACT React pattern
  showCropModal = false;
  imageChangedEvent: any = null;
  croppedImage: string = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.authService.token$.subscribe(token => {
      this.token = token;
    });
  }

  ngOnInit(): void {
    this.currentGroupIcon = this.group.icon;
  }

  get isCurrentUserAdmin(): boolean {
    return this.group.createdBy._id === this.currentUser.id;
  }

  get isCurrentUserActiveMember(): boolean {
    return this.group.members.some(member => member.user._id === this.currentUser.id);
  }

  get canLeaveGroup(): boolean {
    return !this.isCurrentUserAdmin && this.isCurrentUserActiveMember;
  }

  async handleLeaveGroup(): Promise<void> {
    if (this.canLeaveGroup) {
      this.isLeaving = true;
      try {
        this.leaveGroup.emit(this.group._id);
        this.close.emit();
      } catch (error) {
        console.error('Error leaving group:', error);
      } finally {
        this.isLeaving = false;
      }
    }
  }

  handleAddMembers(): void {
    this.addMembers.emit(this.group._id);
    this.close.emit();
  }

  async handleUpdateGroupIcon(newIcon: string): Promise<void> {
    if (!this.token) return;
    
    // Update local state immediately for real-time feedback
    this.currentGroupIcon = newIcon;
    
    this.isUpdatingIcon = true;
    try {
      await this.apiService.updateGroupIcon(this.token, this.group._id, newIcon);
      console.log('Group icon updated successfully');
      // Close modal and reload to refresh for all users
      this.close.emit();
      window.location.reload();
    } catch (error) {
      console.error('Error updating group icon:', error);
      // Revert local state on error
      this.currentGroupIcon = this.group.icon;
      alert('Failed to update group icon');
    } finally {
      this.isUpdatingIcon = false;
    }
  }

  async handleRemoveGroupIcon(): Promise<void> {
    if (!this.token) return;
    
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to remove the group icon?');
    if (!confirmed) return;
    
    // Update local state immediately for real-time feedback
    this.currentGroupIcon = undefined;
    
    this.isUpdatingIcon = true;
    try {
      await this.apiService.removeGroupIcon(this.token, this.group._id);
      console.log('Group icon removed successfully');
    } catch (error) {
      console.error('Error removing group icon:', error);
      // Revert local state on error
      this.currentGroupIcon = this.group.icon;
      alert('Failed to remove group icon');
    } finally {
      this.isUpdatingIcon = false;
    }
  }

  async handleRemoveMember(memberId: string, memberUsername: string): Promise<void> {
    if (!this.token) return;
    
    // Show confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to remove ${memberUsername} from this group?`);
    if (!confirmed) return;
    
    this.removingMemberId = memberId;
    try {
      await this.apiService.removeGroupMember(this.token, this.group._id, memberId);
      console.log('Member removed successfully');
      // Close the modal to refresh the group data
      this.close.emit();
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    } finally {
      this.removingMemberId = null;
    }
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.some(onlineUser => onlineUser.userId === userId);
  }

  onFileSelected(event: Event): void {
    // Show crop modal - EXACT React pattern
    this.imageChangedEvent = event;
    this.showCropModal = true;
  }

  imageCropped(event: ImageCroppedEvent): void {
    // Use base64 for proper storage - NOT objectUrl
    this.croppedImage = event.base64 || '';
  }

  async handleCropComplete(): Promise<void> {
    if (this.croppedImage) {
      await this.handleUpdateGroupIcon(this.croppedImage);
    }
    this.handleCropCancel();
  }

  handleCropCancel(): void {
    this.showCropModal = false;
    this.imageChangedEvent = null;
    this.croppedImage = '';
  }
}
