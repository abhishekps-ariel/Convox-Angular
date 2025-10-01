import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { User } from '../../types/chat-types';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageCropperComponent],
  templateUrl: './profile-modal.html',
  styleUrls: ['./profile-modal.css']
})
export class ProfileModal implements OnInit {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  user: User | null = null;
  token: string | null = null;
  bio = '';
  profilePicture = '';
  isLoading = false;
  previewUrl: string | null = null;
  
  // Image cropper state - EXACT React pattern
  showCropModal = false;
  imageChangedEvent: any = null;
  croppedImage: string = '';

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.user = user;
      this.bio = user?.bio || '';
      this.profilePicture = user?.profilePicture || '';
    });

    this.authService.token$.subscribe(token => {
      this.token = token;
    });
  }

  onFileSelected(event: Event): void {
    // Show crop modal - EXACT React pattern
    this.imageChangedEvent = event;
    this.showCropModal = true;
  }

  imageCropped(event: ImageCroppedEvent): void {
    // Use base64 for proper storage
    this.croppedImage = event.base64 || '';
  }

  handleCropComplete(): void {
    if (this.croppedImage) {
      this.profilePicture = this.croppedImage;
      this.previewUrl = this.croppedImage;
    }
    this.handleCropCancel();
  }

  handleCropCancel(): void {
    this.showCropModal = false;
    this.imageChangedEvent = null;
    this.croppedImage = '';
  }

  async handleSave(): Promise<void> {
    if (!this.token) return;

    this.isLoading = true;
    try {
      const updatedUser = await this.apiService.updateProfile(this.token, {
        bio: this.bio.trim(),
        profilePicture: this.profilePicture || undefined
      });

      if (updatedUser) {
        this.authService.updateUser(updatedUser);
      }

      this.onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      this.isLoading = false;
    }
  }

  handleRemoveProfilePicture(): void {
    if (confirm('Are you sure you want to delete this profile image?')) {
      this.profilePicture = '';
      this.previewUrl = null;
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
